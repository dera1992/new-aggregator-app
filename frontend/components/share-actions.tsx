'use client';

import { useEffect, useState } from 'react';
import { Facebook, Linkedin, Music2, Share2, Twitter } from 'lucide-react';

import { Button } from '@/components/ui/button';

type ShareActionsProps = {
  text: string;
  title?: string;
};

export function ShareActions({ text, title }: ShareActionsProps) {
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(window.location.href);
    }
  }, []);

  const shareText = [title, text].filter(Boolean).join('\n\n');
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(shareUrl);

  const shareLinks = [
    {
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
      icon: Facebook,
    },
    {
      label: 'X',
      href: `https://twitter.com/intent/tweet?text=${encodedText}${shareUrl ? `&url=${encodedUrl}` : ''}`,
      icon: Twitter,
    },
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: Linkedin,
    },
    {
      label: 'TikTok',
      href: `https://www.tiktok.com/share?url=${encodedUrl}&text=${encodedText}`,
      icon: Music2,
    },
  ];

  const handleNativeShare = async () => {
    if (typeof navigator === 'undefined' || !navigator.share) {
      return;
    }
    try {
      await navigator.share({
        title: title ?? 'Share',
        text: shareText,
        url: shareUrl || undefined,
      });
    } catch {
      // No-op: user cancelled or share unsupported.
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-border/70 bg-muted/40 p-2">
      <span className="text-xs font-medium uppercase text-muted-foreground">Share</span>
      <Button type="button" size="sm" variant="outline" onClick={handleNativeShare}>
        <Share2 className="mr-2 h-4 w-4" />
        Share
      </Button>
      {shareLinks.map((link) => {
        const Icon = link.icon;
        return (
          <Button key={link.label} size="sm" variant="ghost" asChild>
            <a href={link.href} target="_blank" rel="noreferrer">
              <Icon className="mr-2 h-4 w-4" />
              {link.label}
            </a>
          </Button>
        );
      })}
    </div>
  );
}
