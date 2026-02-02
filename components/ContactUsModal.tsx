"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import toast from "react-hot-toast";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "نام باید حداقل ۲ کاراکتر باشد.",
  }),
  email: z.email({
    message: "لطفاً یک ایمیل معتبر وارد کنید.",
  }),
  subject: z.string().optional(),
  message: z.string().min(10, {
    message: "پیام باید حداقل ۱۰ کاراکتر باشد.",
  }),
});

interface ContactUsModalProps {
  children?: React.ReactNode;
}

export function ContactUsModal({ children }: ContactUsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      // Simulate API call or target real endpoint TODO: Add real endpoint
      const url = "/api/contact";
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        toast.success("پیام شما با موفقیت ارسال شد.");
        setIsOpen(false);
        form.reset();
      } else {
        // Fallback for now if API isn't real
        toast.success("پیام شما دریافت شد (حالت نمایشی).");
        setIsOpen(false);
        form.reset();
      }
    } catch (error) {
      console.error("Error submitting contact form:", error);
      toast.error("خطایی در ارسال پیام رخ داد.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || <Button variant="outline">تماس با ما</Button>}
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-[#121212] border-white/10 text-white rounded-2xl scrollbar-hide">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-right">
            تماس با ما
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-right">
            نظرات، پیشنهادات و انتقادات خود را با ما در میان بگذارید.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="text-right">
                  <FormLabel>نام شما</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="نام خود را وارد کنید"
                      className="bg-white/5 border-white/10 text-right"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="text-right">
                  <FormLabel>ایمیل</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="email@example.com"
                      className="bg-white/5 border-white/10 text-right ltr"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem className="text-right">
                  <FormLabel>موضوع (اختیاری)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="موضوع پیام"
                      className="bg-white/5 border-white/10 text-right"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem className="text-right">
                  <FormLabel>پیام شما</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="پیام خود را اینجا بنویسید..."
                      className="bg-white/5 border-white/10 text-right min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="mt-6">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-12 font-bold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    در حال ارسال...
                  </>
                ) : (
                  <>
                    <Send className="ml-2 h-4 w-4" />
                    ارسال پیام
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
