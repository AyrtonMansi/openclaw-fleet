'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { jobs } from '@/lib/api';
import { RunDetail, Event, Artifact } from '@/types';
import DashboardLayout from '../../dashboard';

export default function RunDetailPage() {
  const params = useParams();
  const runId = params.id as string;
  const [run, setRun] = useState<RunDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadRun();
    const interval = setInterval(loadRun, 2000);
    return () => clearInterval(interval);
  }, [runId]);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [run?.events]);

  const loadRun = async () => {
    try {
      const res = await jobs.run(runId);
      setRun(res.data);
    } catch (err) {
      console.error('Failed to load run:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderEvent = (event: Event) => {
    switch (event.type) {
      case 'stdout':
        return (
          <div className="font-mono text-sm text-gray-700">
            {event.data.message}
          </div>
        );
      case 'stderr':
        return (
          <div className="font-mono text-sm text-red-600">
            {event.data.message}
          </div>
        );
      case 'error':
        return (
          <div className="p-2 bg-red-50 rounded">
            <span className="text-red-700 font-semibold">Error: </span>
            <span className="text-red-600">{event.data.error}</span>
          </div>
        );
      case 'run_started':
        return (
          <div className="text-green-600 font-medium">
            ▶ Run started
          </div>
        );
      case 'run_finished':
        return (
          <div className={`font-medium ${
            event.data.status === 'succeeded' ? 'text-green-600' : 'text-red-600'
          }`}>
            ⏹ Run finished: {event.data.status}
            {event.data.exit_code !== undefined && ` (exit code: ${event.data.exit_code})`}
          </div>
        );
      case 'tool_call':
        return (
          <div className="text-blue-600 text-sm">
            🔧 Tool call: {event.data.tool_name}
          </div>
        );
      default:
        return (
          <div className="text-gray-500 text-sm">
            [{event.type}] {JSON.stringify(event.data)}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-gray-500">Loading run details...</div>
      </DashboardLayout>
    );
  }

  if (!run) {
    return (
      <DashboardLayout>
        <div className="text-red-500">Run not found</div>
      </DashboardLayout>
    );
  }

  const isRunning = run.status === 'running' || run.status === 'pending';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Run Details</h2>
            <p className="text-gray-500">Job: {run.job_title}</p>
          </div>
          <div className="flex items-center space-x-4">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                run.status === 'succeeded'
                  ? 'bg-green-100 text-green-800'
                  : run.status === 'failed'
                  ? 'bg-red-100 text-red-800'
                  : run.status === 'running'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {isRunning && <span className="animate-pulse mr-2">●</span>}
              {run.status}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="bg-white shadow rounded-lg p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Agent</p>
            <p className="font-medium">{run.agent_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Started</p>
            <p className="font-medium">
              {run.started_at ? new Date(run.started_at).toLocaleString() : '-'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Duration</p>
            <p className="font-medium">
              {run.duration_ms
                ? `${(run.duration_ms / 1000).toFixed(1)}s`
                : isRunning
                ? 'Running...'
                : '-'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Finished</p>
            <p className="font-medium">
              {run.finished_at ? new Date(run.finished_at).toLocaleString() : '-'}
            </p>
          </div>
        </div>

        {/* Logs */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Logs</h3>
          <div className="bg-gray-900 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
            {run.events?.length === 0 ? (
              <p className="text-gray-500">No logs yet...</p>
            ) : (
              run.events?.map((event, idx) => (
                <div key={idx} className="mb-1">
                  {renderEvent(event)}
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* Artifacts */}
        {run.artifacts && run.artifacts.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Artifacts</h3>
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {run.artifacts.map((artifact: Artifact) => (
                    <tr key={artifact.id}>
                      <td className="px-6 py-4 text-sm text-gray-900">{artifact.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {artifact.size ? `${(artifact.size / 1024).toFixed(1)} KB` : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {artifact.download_url && (
                          <a
                            href={artifact.download_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Download
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
