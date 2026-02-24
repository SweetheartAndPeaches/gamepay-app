'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Check, Share2, Download } from 'lucide-react';
import QRCode from 'qrcode';
import { useI18n } from '@/i18n/context';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareUrl: string;
  title?: string;
  description?: string;
}

export default function ShareDialog({
  open,
  onOpenChange,
  shareUrl,
  title,
  description,
}: ShareDialogProps) {
  const { t } = useI18n();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 生成二维码
  useEffect(() => {
    if (open && shareUrl) {
      generateQRCode();
    }
  }, [open, shareUrl]);

  const generateQRCode = async () => {
    try {
      const url = await QRCode.toDataURL(shareUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      setQrCodeUrl(url);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleDownloadQR = async () => {
    try {
      const link = document.createElement('a');
      link.href = qrCodeUrl;
      link.download = `qrcode-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download QR code:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || t('share.defaultTitle'),
          text: description || t('share.defaultDescription'),
          url: shareUrl,
        });
      } catch (error) {
        console.error('Failed to share:', error);
      }
    } else {
      // 如果不支持 Web Share API，则复制链接
      handleCopyLink();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            {title || t('share.title')}
          </DialogTitle>
          <DialogDescription>
            {description || t('share.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4 py-4">
          {/* 二维码显示 */}
          {qrCodeUrl && (
            <div className="bg-white p-4 rounded-lg border-2 border-gray-100 shadow-sm">
              <img
                src={qrCodeUrl}
                alt="QR Code"
                className="w-64 h-64"
              />
            </div>
          )}

          {/* 链接输入框和复制按钮 */}
          <div className="w-full space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50 text-gray-700"
              />
              <Button
                onClick={handleCopyLink}
                variant="outline"
                size="icon"
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 text-center">
              {t('share.copyHint')}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {navigator.share && (
            <Button
              onClick={handleShare}
              variant="default"
              className="flex-1 sm:flex-none"
            >
              <Share2 className="h-4 w-4 mr-2" />
              {t('share.share')}
            </Button>
          )}
          <Button
            onClick={handleDownloadQR}
            variant="outline"
            className="flex-1 sm:flex-none"
          >
            <Download className="h-4 w-4 mr-2" />
            {t('share.downloadQR')}
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            variant="ghost"
            className="flex-1 sm:flex-none"
          >
            {t('common.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
