'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Album } from '@/types/types';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  artist: z.string().optional(),
  albumId: z.string().optional(),
  uri: z.string().min(1, 'URI is required'),
  coverArt: z.string().optional(),
  duration: z.number().min(0).optional(),
});

type SongFormValues = z.infer<typeof formSchema>;

export default function SongForm() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<SongFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      artist: '',
      albumId: '',
      uri: '',
      coverArt: '',
      duration: 0,
    },
  });

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const res = await fetch('/api/albums', { method: "POST" });
        if (res.ok) {
          const result = await res.json();
          if (result.success) {
            setAlbums(result.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch albums', error);
      }
    };
    fetchAlbums();
  }, []);

  async function onSubmit(values: SongFormValues) {
    setLoading(true);
    try {
      const res = await fetch('/api/songs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || 'Failed to create song');

      toast.success('Song created successfully');
      form.reset();
    } catch (error) {
      toast.error('Failed to create song');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-md">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Song Title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="artist"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Artist</FormLabel>
              <FormControl>
                <Input placeholder="Artist Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="albumId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Album</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an album" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {albums.map((album) => (
                    <SelectItem key={album.id} value={album.id}>
                      {album.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="uri"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Audio URI</FormLabel>
              <FormControl>
                <Input placeholder="/music/song.mp3" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="coverArt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cover Art URI</FormLabel>
              <FormControl>
                <Input placeholder="/images/cover.jpg" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duration (seconds)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value === '' ? undefined : Number(value));
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Song'}
        </Button>
      </form>
    </Form>
  );
}
