import { useEffect, useState } from 'react';
import AppLayout from '@/components/layouts/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, BookOpen, ChevronRight, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Syllabus {
  id: string;
  name: string;
  exam_type: string;
  topics: string[];
  description: string | null;
  is_template: boolean;
  created_at: string;
}

const EXAM_TEMPLATES = [
  {
    name: 'UPSC Civil Services',
    exam_type: 'UPSC',
    topics: ['Indian Polity', 'Indian Economy', 'History', 'Geography', 'Science & Technology', 'Environment', 'Current Affairs', 'Ethics'],
    description: 'Comprehensive syllabus for UPSC Civil Services Examination',
  },
  {
    name: 'JEE Main Physics',
    exam_type: 'JEE',
    topics: ['Mechanics', 'Thermodynamics', 'Electromagnetism', 'Optics', 'Modern Physics', 'Waves', 'Rotational Motion'],
    description: 'Physics syllabus for JEE Main examination',
  },
  {
    name: 'NEET Biology',
    exam_type: 'NEET',
    topics: ['Cell Biology', 'Genetics', 'Human Physiology', 'Plant Physiology', 'Ecology', 'Evolution', 'Biotechnology'],
    description: 'Biology syllabus for NEET examination',
  },
];

export default function Syllabi() {
  const { user } = useAuth();
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSyllabus, setEditingSyllabus] = useState<Syllabus | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    exam_type: '',
    topics: '',
    description: '',
  });

  useEffect(() => {
    if (user) {
      fetchSyllabi();
    }
  }, [user]);

  const fetchSyllabi = async () => {
    try {
      const { data, error } = await supabase
        .from('syllabi')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Parse topics from JSONB
      const parsed: Syllabus[] = data?.map(s => ({
        id: s.id,
        name: s.name,
        exam_type: s.exam_type,
        topics: Array.isArray(s.topics) ? (s.topics as string[]) : [],
        description: s.description,
        is_template: s.is_template,
        created_at: s.created_at,
      })) || [];
      
      setSyllabi(parsed);
    } catch (error) {
      console.error('Error fetching syllabi:', error);
      toast.error('Failed to load syllabi');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.exam_type || !formData.topics) {
      toast.error('Please fill in all required fields');
      return;
    }

    const topicsArray = formData.topics.split('\n').filter(t => t.trim());

    try {
      if (editingSyllabus) {
        const { error } = await supabase
          .from('syllabi')
          .update({
            name: formData.name,
            exam_type: formData.exam_type,
            topics: topicsArray,
            description: formData.description || null,
          })
          .eq('id', editingSyllabus.id);

        if (error) throw error;
        toast.success('Syllabus updated successfully');
      } else {
        const { error } = await supabase
          .from('syllabi')
          .insert({
            user_id: user?.id,
            name: formData.name,
            exam_type: formData.exam_type,
            topics: topicsArray,
            description: formData.description || null,
          });

        if (error) throw error;
        toast.success('Syllabus created successfully');
      }

      setDialogOpen(false);
      resetForm();
      fetchSyllabi();
    } catch (error) {
      console.error('Error saving syllabus:', error);
      toast.error('Failed to save syllabus');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this syllabus?')) return;

    try {
      const { error } = await supabase.from('syllabi').delete().eq('id', id);
      if (error) throw error;
      toast.success('Syllabus deleted');
      fetchSyllabi();
    } catch (error) {
      console.error('Error deleting syllabus:', error);
      toast.error('Failed to delete syllabus');
    }
  };

  const handleEdit = (syllabus: Syllabus) => {
    setEditingSyllabus(syllabus);
    setFormData({
      name: syllabus.name,
      exam_type: syllabus.exam_type,
      topics: syllabus.topics.join('\n'),
      description: syllabus.description || '',
    });
    setDialogOpen(true);
  };

  const handleUseTemplate = async (template: typeof EXAM_TEMPLATES[0]) => {
    try {
      const { error } = await supabase.from('syllabi').insert({
        user_id: user?.id,
        name: template.name,
        exam_type: template.exam_type,
        topics: template.topics,
        description: template.description,
      });

      if (error) throw error;
      toast.success('Template added to your syllabi');
      fetchSyllabi();
    } catch (error) {
      console.error('Error adding template:', error);
      toast.error('Failed to add template');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', exam_type: '', topics: '', description: '' });
    setEditingSyllabus(null);
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Syllabi</h1>
            <p className="text-muted-foreground mt-1">
              Manage exam syllabi for question classification
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Syllabus
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingSyllabus ? 'Edit Syllabus' : 'Create New Syllabus'}
                </DialogTitle>
                <DialogDescription>
                  Define the topics for question classification
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Syllabus Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., UPSC Prelims 2024"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exam_type">Exam Type *</Label>
                  <Input
                    id="exam_type"
                    placeholder="e.g., UPSC, JEE, NEET"
                    value={formData.exam_type}
                    onChange={(e) => setFormData({ ...formData, exam_type: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="topics">Topics (one per line) *</Label>
                  <Textarea
                    id="topics"
                    placeholder="Indian Polity&#10;Indian Economy&#10;History&#10;Geography"
                    value={formData.topics}
                    onChange={(e) => setFormData({ ...formData, topics: e.target.value })}
                    rows={6}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of this syllabus"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingSyllabus ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Templates Section */}
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle className="text-lg">Quick Start Templates</CardTitle>
            <CardDescription>Use pre-built syllabi for popular exams</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {EXAM_TEMPLATES.map((template) => (
                <div
                  key={template.name}
                  className="p-4 border rounded-lg hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{template.name}</h4>
                      <Badge variant="secondary" className="mt-1">{template.exam_type}</Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleUseTemplate(template)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {template.topics.length} topics
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {template.topics.slice(0, 3).map((topic) => (
                      <Badge key={topic} variant="outline" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                    {template.topics.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{template.topics.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* User Syllabi */}
        <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <h2 className="text-xl font-semibold mb-4">Your Syllabi</h2>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : syllabi.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No syllabi created yet.</p>
                <p className="text-sm mt-1">Create one or use a template to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {syllabi.map((syllabus) => (
                <Card key={syllabus.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{syllabus.name}</h3>
                        <Badge variant="secondary" className="mt-1">{syllabus.exam_type}</Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(syllabus)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(syllabus.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {syllabus.description && (
                      <p className="text-sm text-muted-foreground mb-3">{syllabus.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {syllabus.topics.slice(0, 4).map((topic) => (
                        <Badge key={topic} variant="outline" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                      {syllabus.topics.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{syllabus.topics.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
