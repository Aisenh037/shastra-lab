import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, Loader2, X, ScanText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PdfUploaderProps {
  onTextExtracted: (text: string) => void;
  disabled?: boolean;
}

const MIN_TEXT_THRESHOLD = 50; // Minimum characters per page to consider it text-based

export default function PdfUploader({ onTextExtracted, disabled }: PdfUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const extractTextFromPdf = async (file: File): Promise<{ text: string; isImageBased: boolean; pdf: pdfjsLib.PDFDocumentProxy }> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    let totalChars = 0;
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n\n';
      totalChars += pageText.length;
    }
    
    const avgCharsPerPage = totalChars / pdf.numPages;
    const isImageBased = avgCharsPerPage < MIN_TEXT_THRESHOLD;
    
    return { text: fullText.trim(), isImageBased, pdf };
  };

  const convertPdfPagesToImages = async (pdf: pdfjsLib.PDFDocumentProxy): Promise<string[]> => {
    const images: string[] = [];
    const scale = 2; // Higher scale for better OCR accuracy
    
    for (let i = 1; i <= pdf.numPages; i++) {
      setProcessingStatus(`Converting page ${i}/${pdf.numPages} to image...`);
      
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) throw new Error('Could not get canvas context');
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;
      
      // Convert to base64 with reduced quality to stay within limits
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      images.push(imageData);
    }
    
    return images;
  };

  const performOcr = async (images: string[]): Promise<string> => {
    setProcessingStatus(`Running OCR on ${images.length} page(s)...`);
    
    const response = await supabase.functions.invoke('ocr-pdf', {
      body: { images },
    });

    if (response.error) {
      throw new Error(response.error.message || 'OCR failed');
    }

    return response.data.text;
  };

  const handleFile = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error('File size must be less than 20MB');
      return;
    }

    setIsProcessing(true);
    setFileName(file.name);
    setProcessingStatus('Analyzing PDF...');

    try {
      const { text, isImageBased, pdf } = await extractTextFromPdf(file);
      
      if (isImageBased) {
        toast.info('Detected scanned PDF. Running OCR...');
        
        // Convert pages to images
        const images = await convertPdfPagesToImages(pdf);
        
        // Perform OCR via edge function
        const ocrText = await performOcr(images);
        
        if (!ocrText.trim()) {
          toast.error('OCR could not extract text from the scanned PDF.');
          setFileName(null);
          return;
        }
        
        onTextExtracted(ocrText);
        toast.success(`OCR extracted text from ${pdf.numPages} page(s)`);
      } else {
        if (!text.trim()) {
          toast.error('Could not extract text from PDF.');
          setFileName(null);
          return;
        }
        onTextExtracted(text);
        toast.success(`Extracted text from ${file.name}`);
      }
    } catch (error) {
      console.error('Error processing PDF:', error);
      const message = error instanceof Error ? error.message : 'Failed to process PDF';
      toast.error(message);
      setFileName(null);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  }, [onTextExtracted]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isProcessing) {
      setIsDragging(true);
    }
  }, [disabled, isProcessing]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || isProcessing) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [disabled, isProcessing, handleFile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const clearFile = () => {
    setFileName(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
          ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onClick={() => !disabled && !isProcessing && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled || isProcessing}
        />
        
        {isProcessing ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">{processingStatus || 'Processing PDF...'}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">
              Drop PDF here or click to upload
            </p>
            <p className="text-xs text-muted-foreground">
              Supports text-based and scanned PDFs (OCR)
            </p>
            <p className="text-xs text-muted-foreground">
              Maximum file size: 20MB
            </p>
          </div>
        )}
      </div>

      {fileName && !isProcessing && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <FileText className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm flex-1 truncate">{fileName}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              clearFile();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
