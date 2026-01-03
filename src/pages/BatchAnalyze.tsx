import { useEffect, useState, useCallback, useRef } from 'react';
import AppLayout from '@/components/layouts/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Upload, FileText, Loader2, X, Check, AlertCircle, Files, Play, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import * as pdfjsLib from 'pdfjs-dist';
import { useNavigate } from 'react-router-dom';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface Syllabus {
  id: string;
  name: string;
  exam_type: string;
  topics: string[];
}

interface QueuedFile {
  id: string;
  file: File;
  name: string;
  status: 'pending' | 'extracting-text' | 'extracting-questions' | 'analyzing' | 'complete' | 'error';
  progress: number;
  questionsCount?: number;
  error?: string;
}

const MIN_TEXT_THRESHOLD = 50;

export default function BatchAnalyze() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [selectedSyllabus, setSelectedSyllabus] = useState<string>('');
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (user) fetchSyllabi();
  }, [user]);

  const fetchSyllabi = async () => {
    const { data, error } = await supabase
      .from('syllabi')
      .select('id, name, exam_type, topics')
      .order('name');
    if (!error && data) {
      setSyllabi(data.map(s => ({
        id: s.id,
        name: s.name,
        exam_type: s.exam_type,
        topics: Array.isArray(s.topics) ? (s.topics as string[]) : [],
      })));
    }
  };

  const extractTextFromPdf = async (file: File): Promise<{ text: string; isImageBased: boolean; pdf: pdfjsLib.PDFDocumentProxy }> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    let totalChars = 0;
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n\n';
      totalChars += pageText.length;
    }
    const avgCharsPerPage = totalChars / pdf.numPages;
    return { text: fullText.trim(), isImageBased: avgCharsPerPage < MIN_TEXT_THRESHOLD, pdf };
  };

  const convertPdfPagesToImages = async (pdf: pdfjsLib.PDFDocumentProxy): Promise<string[]> => {
    const images: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not get canvas context');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: context, viewport }).promise;
      images.push(canvas.toDataURL('image/jpeg', 0.8));
    }
    return images;
  };

  const handleFiles = useCallback((files: FileList | File[]) => {
    const pdfFiles = Array.from(files).filter(f => f.type === 'application/pdf');
    if (pdfFiles.length === 0) {
      toast.error('Please upload PDF files');
      return;
    }
    const newQueued: QueuedFile[] = pdfFiles.map(file => ({
      id: crypto.randomUUID(),
      file,
      name: file.name,
      status: 'pending',
      progress: 0,
    }));
    setQueuedFiles(prev => [...prev, ...newQueued]);
    toast.success(`Added ${pdfFiles.length} file(s) to queue`);
  }, []);

  const removeFile = (id: string) => {
    setQueuedFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearQueue = () => {
    setQueuedFiles([]);
  };

  const updateFileStatus = (id: string, updates: Partial<QueuedFile>) => {
    setQueuedFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const processQueue = async () => {
    if (!selectedSyllabus) {
      toast.error('Please select a syllabus first');
      return;
    }

    const syllabus = syllabi.find(s => s.id === selectedSyllabus);
    if (!syllabus) return;

    const pendingFiles = queuedFiles.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) {
      toast.error('No files to process');
      return;
    }

    setIsProcessing(true);

    for (const queuedFile of pendingFiles) {
      try {
        // Step 1: Extract text from PDF
        updateFileStatus(queuedFile.id, { status: 'extracting-text', progress: 10 });
        
        let rawText = '';
        try {
          const { text, isImageBased, pdf } = await extractTextFromPdf(queuedFile.file);
          
          if (isImageBased) {
            const images = await convertPdfPagesToImages(pdf);
            const ocrResponse = await supabase.functions.invoke('ocr-pdf', {
              body: { images },
            });
            if (ocrResponse.error) throw ocrResponse.error;
            rawText = ocrResponse.data.text;
          } else {
            rawText = text;
          }
        } catch (err) {
          throw new Error('Failed to extract text from PDF');
        }

        if (!rawText.trim()) {
          throw new Error('No text could be extracted');
        }

        updateFileStatus(queuedFile.id, { progress: 30 });

        // Step 2: Extract questions
        updateFileStatus(queuedFile.id, { status: 'extracting-questions', progress: 40 });
        
        const extractResponse = await supabase.functions.invoke('extract-questions', {
          body: { text: rawText },
        });

        if (extractResponse.error) throw extractResponse.error;
        
        const questions = extractResponse.data.questions || [];
        if (questions.length === 0) {
          throw new Error('No questions found in document');
        }

        updateFileStatus(queuedFile.id, { questionsCount: questions.length, progress: 50 });

        // Step 3: Create paper record
        const { data: paper, error: paperError } = await supabase
          .from('exam_papers')
          .insert({
            user_id: user?.id,
            title: queuedFile.name.replace('.pdf', ''),
            exam_type: syllabus.exam_type,
            raw_text: rawText,
            syllabus_id: selectedSyllabus,
            status: 'analyzing',
          })
          .select()
          .single();

        if (paperError) throw paperError;

        // Step 4: Analyze each question
        updateFileStatus(queuedFile.id, { status: 'analyzing', progress: 60 });
        
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          try {
            const analyzeResponse = await supabase.functions.invoke('analyze-question', {
              body: { question: q.question_text, topics: syllabus.topics },
            });

            const analysis = analyzeResponse.error ? {} : analyzeResponse.data;

            await supabase.from('questions').insert({
              paper_id: paper.id,
              user_id: user?.id,
              question_text: q.question_text,
              question_number: q.question_number || i + 1,
              topic: analysis.topic || null,
              difficulty: analysis.difficulty || null,
              importance_explanation: analysis.importance_explanation || null,
              is_analyzed: !analyzeResponse.error,
            });
          } catch {
            // Continue with next question
          }

          const progressIncrement = (40 / questions.length);
          updateFileStatus(queuedFile.id, { progress: 60 + (i + 1) * progressIncrement });
        }

        // Mark paper complete
        await supabase.from('exam_papers').update({ status: 'completed' }).eq('id', paper.id);

        updateFileStatus(queuedFile.id, { status: 'complete', progress: 100 });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Processing failed';
        updateFileStatus(queuedFile.id, { status: 'error', error: message });
      }
    }

    setIsProcessing(false);
    
    const completed = queuedFiles.filter(f => f.status === 'complete').length + pendingFiles.filter(f => f.status !== 'error').length;
    if (completed > 0) {
      toast.success(`Processed ${completed} file(s) successfully`);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const getStatusIcon = (status: QueuedFile['status']) => {
    switch (status) {
      case 'pending': return <FileText className="h-4 w-4 text-muted-foreground" />;
      case 'extracting-text':
      case 'extracting-questions':
      case 'analyzing': return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      case 'complete': return <Check className="h-4 w-4 text-success" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const getStatusLabel = (status: QueuedFile['status']) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'extracting-text': return 'Extracting text...';
      case 'extracting-questions': return 'Finding questions...';
      case 'analyzing': return 'Analyzing...';
      case 'complete': return 'Complete';
      case 'error': return 'Failed';
    }
  };

  const completedCount = queuedFiles.filter(f => f.status === 'complete').length;
  const totalQuestions = queuedFiles.reduce((sum, f) => sum + (f.questionsCount || 0), 0);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="animate-fade-in">
          <h1 className="text-3xl font-display font-bold text-foreground">Batch Analyze</h1>
          <p className="text-muted-foreground mt-1">
            Upload multiple exam papers and analyze them all at once
          </p>
        </div>

        {/* Configuration */}
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Files className="h-5 w-5 text-primary" />
              Batch Configuration
            </CardTitle>
            <CardDescription>
              Select a syllabus and upload multiple PDF files
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Syllabus for Classification *</Label>
              <Select value={selectedSyllabus} onValueChange={setSelectedSyllabus} disabled={isProcessing}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a syllabus" />
                </SelectTrigger>
                <SelectContent>
                  {syllabi.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.topics.length} topics)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isProcessing && inputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf"
                multiple
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
                className="hidden"
                disabled={isProcessing}
              />
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium">Drop PDF files here or click to upload</p>
              <p className="text-xs text-muted-foreground mt-1">
                Upload multiple files at once. Supports text-based and scanned PDFs.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Queue */}
        {queuedFiles.length > 0 && (
          <Card className="animate-scale-in">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Upload Queue ({queuedFiles.length} files)</CardTitle>
                  <CardDescription>
                    {completedCount} completed • {totalQuestions} questions extracted
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {!isProcessing && (
                    <>
                      <Button variant="outline" size="sm" onClick={clearQueue}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Clear
                      </Button>
                      <Button size="sm" onClick={processQueue} disabled={!selectedSyllabus}>
                        <Play className="h-4 w-4 mr-1" />
                        Process All
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {queuedFiles.map((qf) => (
                  <div
                    key={qf.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      qf.status === 'complete' ? 'border-success/30 bg-success/5' :
                      qf.status === 'error' ? 'border-destructive/30 bg-destructive/5' :
                      'border-border bg-background'
                    }`}
                  >
                    {getStatusIcon(qf.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{qf.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {getStatusLabel(qf.status)}
                        </span>
                        {qf.questionsCount && (
                          <Badge variant="secondary" className="text-xs">
                            {qf.questionsCount} questions
                          </Badge>
                        )}
                        {qf.error && (
                          <span className="text-xs text-destructive">{qf.error}</span>
                        )}
                      </div>
                      {(qf.status === 'extracting-text' || qf.status === 'extracting-questions' || qf.status === 'analyzing') && (
                        <Progress value={qf.progress} className="h-1 mt-2" />
                      )}
                    </div>
                    {qf.status === 'pending' && !isProcessing && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeFile(qf.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {completedCount === queuedFiles.length && queuedFiles.length > 0 && !isProcessing && (
                <div className="mt-4 p-4 bg-success/10 rounded-lg text-center">
                  <Check className="h-8 w-8 mx-auto text-success mb-2" />
                  <p className="font-medium">All files processed!</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    {totalQuestions} questions extracted and analyzed
                  </p>
                  <Button onClick={() => navigate('/questions')}>
                    View Questions
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
