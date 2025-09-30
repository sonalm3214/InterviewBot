import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ResumeUploadProps {
  onUploadSuccess: (candidateId: string) => void;
}

export default function ResumeUpload({ onUploadSuccess }: ResumeUploadProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('resume', file);
      
      const response = await apiRequest('POST', '/api/candidates', formData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Resume uploaded successfully",
        description: "Your resume has been processed. Let's continue with the interview.",
      });
      onUploadSuccess(data.id);
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload resume. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setUploading(false);
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploading(true);
      uploadMutation.mutate(file);
    }
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  return (
    <div className="max-w-2xl mx-auto" data-testid="resume-upload-section">
      <Card className="border border-border">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="text-primary text-3xl" />
          </div>
          <h2 className="text-2xl font-semibold mb-4">Upload Your Resume</h2>
          <p className="text-muted-foreground mb-6">
            Please upload your resume in PDF or DOCX format to get started with the interview.
          </p>
          
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 mb-6 transition-colors cursor-pointer ${
              isDragActive 
                ? 'border-primary/50 bg-primary/5' 
                : 'border-border hover:border-primary/50'
            }`}
            data-testid="dropzone-area"
          >
            <input {...getInputProps()} data-testid="file-input" />
            <div className="flex flex-col items-center">
              <Upload className="text-4xl text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">
                {isDragActive ? 'Drop your resume here' : 'Drop your resume here'}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                or click to browse files
              </p>
              <Button 
                variant="outline" 
                disabled={uploading}
                data-testid="browse-files-button"
              >
                {uploading ? 'Uploading...' : 'Choose File'}
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span>Your data is secure and processed locally</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
