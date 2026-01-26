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
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { FormEvent, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { redirect } from "next/navigation";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submitHandler = async (e: FormEvent) => {
    e.preventDefault();
    const request = await fetch("/api/signup", {
      method: "POST",
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    });

    const response = await request.json();

    if (response.success) {
      toast.success(
        response.message ? response.message : "حساب کاربری ساخته شد!"
      );
      redirect("/panel");
    } else {
      toast.error(`خطا! ${response.message}`);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">ثبت نام</CardTitle>
          <CardDescription>
            برای ارسال نظر، ساخت و مدیریت پلی لیست، ارسال آهنگ و متن آهنگ و...
            ثبت نام کنید و وارد حساب کاربری خود شوید!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitHandler}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">نام</FieldLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder="نام خود را وارد کنید"
                  required
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
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
                <FieldLabel htmlFor="password">رمز</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder="حداقل 8 کاراکتر"
                  required
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
              <Field>
                <Button type="submit">ثبت نام</Button>
                <FieldDescription className="text-center">
                  قبلا ثبت نام کرده اید؟ <Link href="/login">ورود به حساب</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        با ثبت نام، شما <a href="/tos">شرایط و قوانین</a> را میپذیرید.
      </FieldDescription>
    </div>
  );
}
