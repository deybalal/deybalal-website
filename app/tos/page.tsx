import { Button } from "@/components/ui/button";
import { ShieldCheck, Music, Lock, Heart, Users, Globe } from "lucide-react";
import Link from "next/link";

export default function TOSPage() {
  return (
    <div className="min-h-screen h-max bg-transparent relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-purple-500/10 dark:bg-purple-900/20 blur-3xl -z-10 rounded-b-[50%]" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 dark:bg-blue-900/20 blur-3xl -z-10 rounded-full" />

      <div className="container mx-auto px-4 py-12 md:py-20 max-w-5xl">
        {/* Header Section */}
        <div className="text-center mb-16 relative">
          <div className="inline-block p-3 rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-xl mb-6 shadow-lg border border-white/20 dark:border-white/10">
            <ShieldCheck className="w-12 h-12 text-purple-600 dark:text-purple-400" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 bg-clip-text text-transparent bg-linear-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 leading-tight">
            شرایط و قوانین استفاده
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            به دی بلال خوش آمدید. ما متعهد به محافظت از حریم خصوصی شما و ارائه
            بهترین تجربه شنیداری هستیم.
          </p>
        </div>

        {/* Privacy Promise Section - Main Highlight */}
        <div className="mb-20">
          <div className="relative bg-linear-to-br from-white/80 to-purple-50/80 dark:from-gray-900/80 dark:to-black/80 backdrop-blur-2xl rounded-3xl p-8 md:p-12 border border-purple-100 dark:border-white/10 shadow-2xl overflow-hidden group hover:border-purple-300 dark:hover:border-purple-500/30 transition-all duration-500">
            {/* Ambient Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[100px] -z-10 group-hover:bg-purple-500/20 transition-all duration-500" />

            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="flex-1 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-1 w-12 bg-green-500 rounded-full" />
                  <span className="text-green-600 dark:text-green-400 font-bold tracking-wider text-sm uppercase">
                    تضمین امنیت
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  حریم خصوصی شما امن است
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  ما در دی بلال به حریم خصوصی شما احترام می‌گذاریم. ما{" "}
                  <span className="text-purple-600 dark:text-purple-400 font-bold">
                    هیچ‌گونه اطلاعات شخصی
                  </span>{" "}
                  از شما ذخیره نمی‌کنیم و از داده‌های شما برای اهداف تبلیغاتی
                  استفاده نخواهیم کرد. تمام فعالیت‌های شما در پلتفرم به صورت
                  ناشناس و امن باقی می‌ماند.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/5">
                    <Lock className="w-5 h-5 text-green-500" />
                    <span className="font-medium">رمزنگاری داده‌ها</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/5">
                    <Users className="w-5 h-5 text-blue-500" />
                    <span className="font-medium">بدون ردیابی کاربر</span>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full animate-pulse" />
                <Lock
                  className="w-40 h-40 text-gray-900 dark:text-white relative z-10 drop-shadow-2xl"
                  strokeWidth={1.5}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {[
            {
              icon: Music,
              title: "کیفیت صدای عالی",
              desc: "دسترسی به آرشیو موسیقی لری با بالاترین کیفیت ممکن.",
              color: "text-pink-500",
              bg: "bg-pink-500/10",
              border: "group-hover:border-pink-500/30",
            },
            {
              icon: Globe,
              title: "دسترسی جهانی",
              desc: "بدون محدودیت جغرافیایی، هر کجا که هستید موسیقی گوش دهید.",
              color: "text-blue-500",
              bg: "bg-blue-500/10",
              border: "group-hover:border-blue-500/30",
            },
            {
              icon: Heart,
              title: "کاملاً رایگان",
              desc: "تمامی امکانات دی بلال رایگان است و همیشه رایگان خواهد ماند.",
              color: "text-red-500",
              bg: "bg-red-500/10",
              border: "group-hover:border-red-500/30",
            },
          ].map((item, i) => (
            <div
              key={i}
              className={`group bg-white/60 dark:bg-gray-900/40 backdrop-blur-md p-8 rounded-2xl border border-white/20 dark:border-white/10 hover:-translate-y-2 transition-all duration-300 ${item.border}`}
            >
              <div
                className={`w-14 h-14 ${item.bg} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
              >
                <item.icon className={`w-7 h-7 ${item.color}`} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                {item.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Terms Content */}
        <div className="prose dark:prose-invert max-w-none bg-white/40 dark:bg-black/20 backdrop-blur-xl p-8 md:p-12 rounded-3xl border border-white/20 dark:border-white/10">
          <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-3">
            <span className="w-2 h-8 bg-purple-500 rounded-full" />
            سایر شرایط
          </h3>

          <ul className="space-y-4 list-none p-0 m-0">
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2.5 shrink-0" />
              <p className="text-gray-600 dark:text-gray-300 m-0">
                تمامی حقوق محتوای صوتی متعلق به هنرمندان و صاحبان اثر می‌باشد و
                دی بلال تنها بستری برای انتشار آن‌هاست.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2.5 shrink-0" />
              <p className="text-gray-600 dark:text-gray-300 m-0">
                استفاده از خدمات ما به معنای پذیرش این قوانین است. قوانین ممکن
                است در هر زمان تغییر کنند.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2.5 shrink-0" />
              <p className="text-gray-600 dark:text-gray-300 m-0">
                هرگونه سوءاستفاده از پلتفرم یا تلاش برای دسترسی غیرمجاز پیگرد
                قانونی خواهد داشت.
              </p>
            </li>
          </ul>

          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-white/10 flex justify-center">
            <Link href="/">
              <Button
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg shadow-purple-500/20 px-8 py-6 text-lg"
              >
                بازگشت به صفحه اصلی
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
