import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAIRuns } from '../hooks/useApi';
import { Card } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Form';
import type { AIRun } from '../types';

export function AIRunsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);
  const { data, isLoading, error } = useAIRuns({ page, limit: 20 });

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(newPage));
    setSearchParams(params);
  };

  const statusColors: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
    SUCCESS: 'success',
    PENDING: 'info',
    FAILED: 'danger',
    TIMEOUT: 'warning',
  };

  const statusIcons: Record<string, React.ReactNode> = {
    SUCCESS: <CheckCircle className="h-4 w-4" />,
    PENDING: <Clock className="h-4 w-4 animate-spin" />,
    FAILED: <XCircle className="h-4 w-4" />,
    TIMEOUT: <Clock className="h-4 w-4" />,
  };

  const columns = [
    { 
      key: 'contentId', 
      header: 'Content', 
      className: 'min-w-[150px]',
      render: (item: AIRun) => (
        <Link to={`/content/${item.contentId}`} className="text-primary-600 hover:underline font-mono text-sm truncate block max-w-xs">
          {item.contentId.slice(0, 8)}...
        </Link>
      )
    },
    { 
      key: 'status', 
      header: 'Status', 
      className: 'w-[100px]',
      render: (item: AIRun) => (
        <Badge variant={statusColors[item.status] || 'default'} className="gap-1">
          {statusIcons[item.status]}
          {item.status}
        </Badge>
      )
    },
    { 
      key: 'tone', 
      header: 'Tone', 
      className: 'hidden sm:table-cell',
      render: (item: AIRun) => (
        <Badge variant="secondary" size="sm">{item.tone}</Badge>
      )
    },
    { 
      key: 'length', 
      header: 'Length', 
      className: 'hidden sm:table-cell',
      render: (item: AIRun) => (
        <Badge variant="secondary" size="sm">{item.length}</Badge>
      )
    },
    { 
      key: 'tokensAwarded', 
      header: 'Tokens', 
      className: 'w-[80px] text-center',
      render: (item: AIRun) => (
        <span className="flex items-center justify-center gap-1 font-medium text-primary-600">
          <Award className="h-4 w-4" />
          {item.tokensAwarded ?? 0}
        </span>
      )
    },
    { 
      key: 'latencyMs', 
      header: 'Latency', 
      className: 'hidden md:table-cell',
      render: (item: AIRun) => 
        item.latencyMs ? `${item.latencyMs}ms` : '—'
    },
    { 
      key: 'createdAt', 
      header: 'Created', 
      className: 'hidden lg:table-cell',
      render: (item: AIRun) => 
        new Date(item.createdAt).toLocaleString()
    },
    { 
      key: 'output', 
      header: 'Output', 
      className: 'min-w-[200px]',
      render: (item: AIRun) => (
        <div className="max-w-xs">
          {item.output ? (
            <span className="text-surface-600 line-clamp-2">{item.output}</span>
          ) : item.errorMessage ? (
            <span className="text-red-600">{item.errorMessage}</span>
          ) : (
            <span className="text-surface-400">—</span>
          )}
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">AI Runs History</h1>
        <p className="text-surface-500 mt-1">Track all AI summarization runs</p>
      </div>

      <Card padding="none">
        {isLoading ? (
          <div className="p-8 space-y-3" role="status" aria-busy="true">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-surface-100 animate-pulse rounded" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600" role="alert">
            Failed to load AI runs
          </div>
        ) : (
          <>
            <Table
              columns={columns}
              data={data?.data || []}
              keyExtractor={(item) => item.id}
              emptyMessage="No AI runs yet. Create content and generate a summary!"
              responsive={true}
            />
            {data && data.pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-surface-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-sm text-surface-500 text-center sm:text-left">
                  Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.totalItems} runs)
                </p>
                <div className="flex justify-center sm:justify-end gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handlePageChange(data.pagination.page - 1)}
                    disabled={data.pagination.page === 1}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handlePageChange(data.pagination.page + 1)}
                    disabled={data.pagination.page === data.pagination.totalPages}
                    aria-label="Next page"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
