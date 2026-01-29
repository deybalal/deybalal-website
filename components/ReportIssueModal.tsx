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
import { AlertTriangle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "نام باید حداقل ۲ کاراکتر باشد.",
  }),
  email: z.string().email({
    message: "لطفاً یک ایمیل معتبر وارد کنید.",
  }),
  phone: z.string().min(10, {
    message: "لطفاً یک شماره معتبر وارد کنید.",
  }),
  songTitle: z.string(),
  songUrl: z.string(),
  description: z.string().min(10, {
    message: "توضیحات باید حداقل ۱۰ کاراکتر باشد.",
  }),
});

interface ReportIssueModalProps {
  songTitle: string;
  songUrl: string;
}

export function ReportIssueModal({
  songTitle,
  songUrl,
}: ReportIssueModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      songTitle: songTitle,
      songUrl: songUrl,
      description: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const url = process.env.NEXT_PUBLIC_REPORT_URL || "/api/contact/report";
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        toast.success("گزارش شما با موفقیت ارسال شد.");
        setIsOpen(false);
        form.reset({
          ...form.getValues(),
          description: "",
        });
      } else {
        toast.error("خطایی در ارسال گزارش رخ داد. لطفاً دوباره تلاش کنید.");
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error("خطایی در ارتباط با سرور رخ داد.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 border-orange-500/50 text-orange-500 hover:bg-orange-500/10 hover:text-orange-400 transition-all rounded-xl px-6 h-12"
        >
          <AlertTriangle className="w-4 h-4" />
          گزارش اشتباه / درخواست حذف
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-[#121212] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-right">
            گزارش اشتباه در اطلاعات
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-right">
            لطفاً اطلاعات صحیح یا اشتباه موجود را توضیح دهید تا بررسی و اصلاح
            شود. <br />
            <br />
            <span className="text-red-500">
              در صورتی که درخواست حذف آهنگ از سایت را دارید، در توضیحات حتما
              رابطه ی خود با صاحب اثر را ذکر کنید. (مدیر برنامه، شرکت توزیع و
              نشر، ...)
            </span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                name="phone"
                render={({ field }) => (
                  <FormItem className="text-right">
                    <FormLabel>شماره تماس</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="09123456789"
                        className="bg-white/5 border-white/10 text-right ltr"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="songTitle"
              render={({ field }) => (
                <FormItem className="text-right">
                  <FormLabel>نام آهنگ</FormLabel>
                  <FormControl>
                    <Input
                      readOnly
                      className="bg-white/5 border-white/10 text-right opacity-70 cursor-not-allowed"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="songUrl"
              render={({ field }) => (
                <FormItem className="text-right">
                  <FormLabel>آدرس آهنگ</FormLabel>
                  <FormControl>
                    <Input
                      readOnly
                      className="bg-white/5 border-white/10 text-right opacity-70 cursor-not-allowed ltr"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="text-right">
                  <FormLabel>توضیحات مشکل</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="توضیحات خود را اینجا بنویسید..."
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
                className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-xl h-12 font-bold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    در حال ارسال...
                  </>
                ) : (
                  "ارسال گزارش"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
