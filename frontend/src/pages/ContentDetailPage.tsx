import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, Copy, Check } from 'lucide-react';
import { useContent, useSummarize } from '../hooks/useApi';
import { useTokenEarnedToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Form';
import { Select } from '../components/ui/Form';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import type { Tone, Length } from '../types';

export function ContentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: content, isLoading, error } = useContent(id!);
  const { mutate: summarize, isPending } = useSummarize();
  const showTokenEarned = useTokenEarnedToast();
  
  const [tone, setTone] = useState<Tone>('professional');
  const [length, setLength] = useState<Length>('medium');
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const toneOptions = [
    { value: 'professional', label: 'Professional' },
    { value: 'casual', label: 'Casual' },
    { value: 'funny', label: 'Funny' },
  ];

  const lengthOptions = [
    { value: 'short', label: 'Short' },
    { value: 'medium', label: 'Medium' },
    { value: 'long', label: 'Long' },
  ];

  const handleSummarize = () => {
    if (!id) return;
    setSummaryLoading(true);
    setSummary(null);
    summarize(
      { contentId: id, tone, length, promptVersion: 'v1' },
      {
        onSuccess: (response) => {
          const { output, tokensAwarded, totalTokenBalance } = response.data.data!;
          setSummary(output);
          showTokenEarned(tokensAwarded, totalTokenBalance);
          setSummaryLoading(false);
          setCooldown(15);
          const timer = setInterval(() => {
            setCooldown((c) => {
              if (c <= 1) { clearInterval(timer); return 0; }
              return c - 1;
            });
          }, 1000);
        },
        onError: () => {
          setSummaryLoading(false);
        },
      }
    );
  };

  const handleCopy = async () => {
    if (summary) {
      await navigator.clipboard.writeText(summary);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-slide-up" role="status" aria-busy="true">
        <div className="h-8 bg-surface-100 animate-pulse rounded w-full max-w-xs" />
        <div className="h-32 bg-surface-100 animate-pulse rounded" />
        <div className="h-20 bg-surface-100 animate-pulse rounded" />
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Content not found</p>
        <Link to="/content" className="mt-4 inline-block text-primary-600 hover:underline">Back to Content</Link>
      </div>
    );
  }

  const isOnCooldown = cooldown > 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-slide-up">
      <div className="flex items-center gap-4 flex-wrap">
        <Link to="/content" className="p-2 rounded-xl hover:bg-surface-100 transition-colors flex-shrink-0" aria-label="Back to content">
          <ArrowLeft className="h-5 w-5 text-surface-500" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-surface-900 truncate">{content.title}</h1>
          <p className="text-surface-500 text-sm">Created {new Date(content.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <Card padding="lg">
        <div className="prose prose-surface max-w-none">
          <p className="whitespace-pre-wrap text-surface-700 leading-relaxed">{content.body}</p>
        </div>
        
        {content.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {content.tags.map((tag) => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
        )}
      </Card>

      <Card padding="lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 flex-wrap">
            <Sparkles className="h-5 w-5 text-primary-600 flex-shrink-0" />
            AI Summarize
          </CardTitle>
          <CardDescription>Generate a summary and earn tokens</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Tone"
              options={toneOptions}
              value={tone}
              onChange={(e) => setTone(e.target.value as Tone)}
            />
            <Select
              label="Length"
              options={lengthOptions}
              value={length}
              onChange={(e) => setLength(e.target.value as Length)}
            />
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={handleSummarize}
            disabled={isPending || summaryLoading || isOnCooldown}
            loading={summaryLoading}
          >
            {isOnCooldown ? (
              <>
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Wait {cooldown}s...
                </span>
              </>
            ) : summaryLoading ? (
              'Summarizing...'
            ) : (
              'Generate Summary'
            )}
          </Button>

          {isOnCooldown && (
            <p className="text-sm text-surface-500 text-center">
              Idempotency guard active — please wait {cooldown}s before retrying
            </p>
          )}

          {summary && (
            <div className="space-y-3 animate-slide-up">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h3 className="font-medium text-surface-900">Summary</h3>
                <Button variant="ghost" size="sm" onClick={handleCopy} aria-label={copySuccess ? 'Copied!' : 'Copy to clipboard'}>
                  {copySuccess ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="p-4 rounded-xl bg-surface-50 border border-surface-200">
                <p className="whitespace-pre-wrap text-surface-700">{summary}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {content.mediaAssets.length > 0 && (
        <Card padding="lg">
          <h3 className="font-medium text-surface-900 mb-4">Media Assets</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {content.mediaAssets.map((asset) => (
              <div key={asset.id} className="p-4 rounded-xl bg-surface-50 border border-surface-200">
                <p className="font-medium text-sm text-surface-900 truncate">{asset.originalName}</p>
                <p className="text-xs text-surface-500 mt-1 capitalize">{asset.status}</p>
                {asset.cloudinaryUrl && (
                  <a href={asset.cloudinaryUrl} target="_blank" rel="noopener noreferrer" className="mt-2 text-sm text-primary-600 hover:underline inline-block">
                    View on Cloudinary
                  </a>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
