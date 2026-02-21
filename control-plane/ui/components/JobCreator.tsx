'use client';

import { useState } from 'react';
import { Play, Save, Zap, Code, FileText, Settings, ChevronRight } from 'lucide-react';

interface JobCreatorProps {
  onSubmit: (job: any) => void;
  templates?: JobTemplate[];
}

interface JobTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  payload: Record<string, any>;
}

const DEFAULT_TEMPLATES: JobTemplate[] = [
  {
    id: 'command',
    name: 'Shell Command',
    description: 'Execute a shell command',
    icon: <Code className="w-5 h-5" />,
    payload: {
      type: 'command',
      command: ['echo', 'Hello World']
    }
  },
  {
    id: 'script',
    name: 'Python Script',
    description: 'Run a Python script',
    icon: <FileText className="w-5 h-5" />,
    payload: {
      type: 'script',
      language: 'python',
      code: 'print("Hello from OpenClaw!")'
    }
  },
  {
    id: 'analysis',
    name: 'Data Analysis',
    description: 'Analyze data with AI',
    icon: <Zap className="w-5 h-5" />,
    payload: {
      type: 'analysis',
      prompt: 'Analyze the following data:',
      data: {}
    }
  }
];

export function JobCreator({ onSubmit, templates = DEFAULT_TEMPLATES }: JobCreatorProps) {
  const [step, setStep] = useState<'template' | 'details' | 'review'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<JobTemplate | null>(null);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState(5);
  const [payload, setPayload] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [estimatedTokens, setEstimatedTokens] = useState(1000);

  const selectTemplate = (template: JobTemplate) => {
    setSelectedTemplate(template);
    setTitle(template.name);
    setPayload(JSON.stringify(template.payload, null, 2));
    setStep('details');
  };

  const handleSubmit = () => {
    try {
      const job = {
        title,
        priority,
        payload: JSON.parse(payload),
        routing: {
          required_tags: tags
        },
        estimated_tokens: estimatedTokens
      };
      onSubmit(job);
      // Reset
      setStep('template');
      setSelectedTemplate(null);
      setTitle('');
      setPayload('');
      setTags([]);
    } catch (e) {
      alert('Invalid JSON in payload');
    }
  };

  const addTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Play className="w-5 h-5 text-blue-500" />
        <h3 className="font-semibold text-gray-900">Create Job</h3>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-6">
        <div className={`flex items-center gap-1 text-sm ${step === 'template' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
          <span className="w-6 h-6 rounded-full bg-current text-white flex items-center justify-center text-xs">1</span>
          Template
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <div className={`flex items-center gap-1 text-sm ${step === 'details' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
          <span className="w-6 h-6 rounded-full bg-current text-white flex items-center justify-center text-xs">2</span>
          Details
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <div className={`flex items-center gap-1 text-sm ${step === 'review' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
          <span className="w-6 h-6 rounded-full bg-current text-white flex items-center justify-center text-xs">3</span>
          Submit
        </div>
      </div>

      {/* Step 1: Template Selection */}
      {step === 'template' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => selectTemplate(template)}
              className="flex flex-col items-center p-4 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <div className="p-3 bg-blue-100 rounded-lg mb-3 text-blue-600">
                {template.icon}
              </div>
              <p className="font-medium text-gray-900">{template.name}</p>
              <p className="text-xs text-gray-500 mt-1">{template.description}</p>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Details */}
      {step === 'details' && selectedTemplate && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Enter job title..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority (1-10)
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">Lower = higher priority</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Est. Tokens
              </label>
              <input
                type="number"
                value={estimatedTokens}
                onChange={(e) => setEstimatedTokens(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">For budgeting</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Required Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Add tag..."
              />
              <button
                onClick={addTag}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-sm rounded"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payload (JSON)
            </label>
            <textarea
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('template')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Back
            </button>
            <button
              onClick={() => setStep('review')}
              disabled={!title}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Review
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 'review' && (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Job Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Title:</span>
                <span className="font-medium">{title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Template:</span>
                <span className="font-medium">{selectedTemplate?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Priority:</span>
                <span className="font-medium">{priority}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Est. Tokens:</span>
                <span className="font-medium">{estimatedTokens.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tags:</span>
                <span className="font-medium">{tags.join(', ') || 'None'}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('details')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Play className="w-4 h-4" />
              Submit Job
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
