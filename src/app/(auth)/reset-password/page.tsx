"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Card, Input, Label, TextField, FieldError } from "@heroui/react";
import { useRouter } from "next/navigation";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetPasswordForm = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(_data: ResetPasswordForm) {
    setIsLoading(true);
    setError(null);
    // No backend — just redirect
    router.push("/dashboard");
  }

  return (
    <Card>
      <Card.Header>
        <div className="flex flex-col gap-1">
          <Card.Title>Set new password</Card.Title>
          <Card.Description>Choose a strong password for your account</Card.Description>
        </div>
      </Card.Header>
      <Card.Content className="flex flex-col gap-4">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <TextField isInvalid={!!errors.password}>
            <Label>New Password</Label>
            <Input
              {...register("password")}
              type="password"
              placeholder="Enter new password"
              autoComplete="new-password"
            />
            <FieldError>{errors.password?.message}</FieldError>
          </TextField>

          <TextField isInvalid={!!errors.confirmPassword}>
            <Label>Confirm Password</Label>
            <Input
              {...register("confirmPassword")}
              type="password"
              placeholder="Confirm new password"
              autoComplete="new-password"
            />
            <FieldError>{errors.confirmPassword?.message}</FieldError>
          </TextField>

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button type="submit" variant="primary" isDisabled={isLoading} className="w-full">
            {isLoading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </Card.Content>
    </Card>
  );
}
