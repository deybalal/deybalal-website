import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import { redirect } from "next/navigation";
import { usePlayerStore } from "@/hooks/usePlayerStore";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const setDownloadPreference = usePlayerStore(
    (state) => state.setDownloadPreference
  );

  const loginHandler = async (e: FormEvent) => {
    e.preventDefault();
    const request = await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const response = await request.json();

    if (response.success) {
      toast.success(
        response.message ? response.message : "ورود موفق به حساب کاربری"
      );
      if (response.downloadPreference) {
        setDownloadPreference(response.downloadPreference);
      }
      redirect("/panel");
    } else {
      toast.error(`خطا! ${response.message}`);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl flex flex-col gap-y-4">
            <span>خَش اومیی!</span>
            <span>خوش آمدید!</span>
          </CardTitle>
          <CardDescription>
            برای ارسال نظر، ساخت و مدیریت پلی لیست، ارسال آهنگ و متن آهنگ و...
            وارد حساب کاربری خود شوید!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={loginHandler}>
            <FieldGroup>
              <Field>
                <Button variant="outline" type="button">
                  <svg
                    id="instagram"
                    fill="rgb(217, 50, 117)"
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    x="0px"
                    y="0px"
                    width="169.063px"
                    height="169.063px"
                    viewBox="0 0 169.063 169.063"
                  >
                    <g>
                      <path
                        d="M122.406,0H46.654C20.929,0,0,20.93,0,46.655v75.752c0,25.726,20.929,46.655,46.654,46.655h75.752
                          c25.727,0,46.656-20.93,46.656-46.655V46.655C169.063,20.93,148.133,0,122.406,0z M154.063,122.407
                          c0,17.455-14.201,31.655-31.656,31.655H46.654C29.2,154.063,15,139.862,15,122.407V46.655C15,29.201,29.2,15,46.654,15h75.752
                          c17.455,0,31.656,14.201,31.656,31.655V122.407z"
                      />
                      <path
                        d="M84.531,40.97c-24.021,0-43.563,19.542-43.563,43.563c0,24.02,19.542,43.561,43.563,43.561s43.563-19.541,43.563-43.561
                          C128.094,60.512,108.552,40.97,84.531,40.97z M84.531,113.093c-15.749,0-28.563-12.812-28.563-28.561
                          c0-15.75,12.813-28.563,28.563-28.563s28.563,12.813,28.563,28.563C113.094,100.281,100.28,113.093,84.531,113.093z"
                      />
                      <path
                        d="M129.921,28.251c-2.89,0-5.729,1.17-7.77,3.22c-2.051,2.04-3.23,4.88-3.23,7.78c0,2.891,1.18,5.73,3.23,7.78
                          c2.04,2.04,4.88,3.22,7.77,3.22c2.9,0,5.73-1.18,7.78-3.22c2.05-2.05,3.22-4.89,3.22-7.78c0-2.9-1.17-5.74-3.22-7.78
                          C135.661,29.421,132.821,28.251,129.921,28.251z"
                      />
                    </g>
                  </svg>
                  لاگین با حساب اینستاگرام
                </Button>
                <Button variant="outline" type="button">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  لاگین با حساب گوگل
                </Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                یا ورود با ایمیل و رمز
              </FieldSeparator>
              <Field>
                <FieldLabel htmlFor="email">ایمیل</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field>
                <div className="flex items-center justify-between w-full">
                  <FieldLabel htmlFor="password">رمز</FieldLabel>
                  <a
                    href="#"
                    className="mr-auto text-sm underline-offset-4 hover:underline"
                  >
                    فراموشی رمز؟
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="حداقل 8 کاراکتر"
                  required
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
              <Field>
                <Button className="text-xl" onClick={loginHandler}>
                  ورود
                </Button>
                <FieldDescription className="text-center">
                  حساب کاربری ندارید؟ <Link href="/signup">ساخت حساب</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        با ورود به حساب، شما <a href="/tos">شرایط و قوانین</a> را میپذیرید.
      </FieldDescription>
    </div>
  );
}
