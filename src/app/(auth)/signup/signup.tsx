"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
import { useToast } from "@/hooks/use-toast";
import { axiosInstance } from "@/lib/axiosInstance";

const FormSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(2, {
    message: "Password must be at least 2 characters.",
  }),
});

export function SignUp() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    try {
      // Send registration request to the API
      const response = await axiosInstance.post("/register", {
        email: data.email,
        password: data.password,
      });

      toast({
        description: "Registration successful. Please check your email for verification.",
      });
    } catch (error) {
      toast({
        description: "Registration failed. Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="flex flex-col justify-between h-[100svh] w-full">
      {/* HEADER */}
      <div className=""></div>
      {/* BODY */}
      <div className="flex flex-col overflow-y-auto">
        <div className="flex flex-col max-w-[500px] w-full px-4 xl:px-10 pb-4 pt-12 xl:py-12 mx-auto border rounded-2">
          <p className="text-2xl text-center font-bold pb-5">Sign up</p>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="jan.kowalski@gmail.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter your password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Sign up
              </Button>
            </form>
          </Form>
        </div>
      </div>
      {/* FOOTER */}
      <div className=""></div>
    </div>
  );
}
