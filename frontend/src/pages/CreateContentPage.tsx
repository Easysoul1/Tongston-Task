import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCreateContent } from '../hooks/useApi';
import { extractErrorMessage } from '../api/client';
import { Button } from '../components/ui/Form';
import { Input } from '../components/ui/Form';
import { Textarea } from '../components/ui/Form';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/Card';

export function CreateContentPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [error, setError] = useState('');
  const { mutate: create, isPending } = useCreateContent();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);
    create(
      { title, body, tags: tagArray },
      {
        onSuccess: (response) => {
          const content = response.data.data!;
          navigate(`/content/${content.id}`);
        },
        onError: (err: unknown) => setError(extractErrorMessage(err, 'Failed to create content')),
      }
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-slide-up">
      <div className="flex items-center gap-4">
        <Link to="/content" className="p-2 rounded-xl hover:bg-surface-100 transition-colors" aria-label="Back to content">
          <ArrowLeft className="h-5 w-5 text-surface-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Create Content</h1>
          <p className="text-surface-500 text-sm">Write something new</p>
        </div>
      </div>

      <Card padding="lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary-600" />
            New Content
          </CardTitle>
          <CardDescription>Fill in the details below to create your content</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm" role="alert">
              {error}
            </div>
          )}

          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title..."
            required
            maxLength={200}
          />

          <Textarea
            label="Body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your content here..."
            required
            maxLength={10000}
            rows={12}
          />

          <Input
            label="Tags (comma-separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="tech, ai, tutorial"
            helperText="Separate tags with commas"
          />

          <CardFooter className="border-t border-surface-200 pt-4">
            <div className="flex justify-end gap-3 w-full">
              <Link to="/content">
                <Button variant="secondary" type="button">Cancel</Button>
              </Link>
              <Button type="submit" loading={isPending} size="lg">
                {isPending ? 'Creating...' : 'Create Content'}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}