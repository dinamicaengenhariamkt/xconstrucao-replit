'use client';

import { useRef, useState } from 'react';
import { RiUploadCloud2Line, RiLoader4Line } from 'react-icons/ri';
import { Button } from '@shared/components/ui/button';
import { useToast } from '@shared/hooks/use-toast';
import { useUpload, type UploadKind, type CommitResponse } from '@features/shared/hooks/use-uploads';

interface FileUploaderProps {
  kind: UploadKind;
  accept: string;
  label?: string;
  helper?: string;
  buttonVariant?: 'default' | 'outline' | 'secondary' | 'ghost';
  testId?: string;
  disabled?: boolean;
  extras?: { tipoDocumento?: string; observacao?: string };
  onUploaded: (file: CommitResponse) => void | Promise<void>;
  className?: string;
}

export function FileUploader({
  kind,
  accept,
  label = 'Enviar arquivo',
  helper,
  buttonVariant = 'outline',
  testId,
  disabled,
  extras,
  onUploaded,
  className,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { upload, pending, progress } = useUpload();
  const [busy, setBusy] = useState(false);

  const handlePick = () => inputRef.current?.click();

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const result = await upload({ file, kind, extras });
      await onUploaded(result);
      toast({ title: 'Arquivo enviado', description: file.name });
    } catch (err) {
      toast({
        title: 'Falha no upload',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const isLoading = pending || busy;

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
        data-testid={testId ? `${testId}-input` : undefined}
        disabled={disabled || isLoading}
      />
      <Button
        type="button"
        variant={buttonVariant}
        onClick={handlePick}
        disabled={disabled || isLoading}
        data-testid={testId}
        className="gap-2"
      >
        {isLoading ? (
          <RiLoader4Line className="w-4 h-4 animate-spin" />
        ) : (
          <RiUploadCloud2Line className="w-4 h-4" />
        )}
        {isLoading ? `Enviando... ${progress}%` : label}
      </Button>
      {helper && <p className="text-xs text-muted-foreground mt-1">{helper}</p>}
    </div>
  );
}
