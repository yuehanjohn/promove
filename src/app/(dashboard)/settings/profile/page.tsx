"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  Card,
  Input,
  Label,
  TextField,
  FieldError,
  Description,
  Avatar,
} from "@heroui/react";

const profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      email: "",
    },
  });

  async function onSubmit(_data: ProfileForm) {
    setIsLoading(true);
    setMessage(null);
    // No backend — just show success
    setMessage({ type: "success", text: "Profile updated successfully." });
    setIsLoading(false);
  }

  function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setAvatarUrl(url);
    setMessage({ type: "success", text: "Avatar updated." });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Profile Settings</h1>

      <Card>
        <Card.Header>
          <Card.Title>Avatar</Card.Title>
        </Card.Header>
        <Card.Content className="flex flex-row items-center gap-4">
          <Avatar size="lg">
            {avatarUrl && <Avatar.Image src={avatarUrl} />}
            <Avatar.Fallback>U</Avatar.Fallback>
          </Avatar>
          <label className="cursor-pointer">
            <span className="inline-flex items-center justify-center rounded-md border border-default-200 px-3 py-1.5 text-sm font-medium hover:bg-default-100 transition-colors cursor-pointer">
              Upload Photo
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </label>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title>Personal Information</Card.Title>
        </Card.Header>
        <Card.Content>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <TextField isInvalid={!!errors.fullName}>
              <Label>Full Name</Label>
              <Input {...register("fullName")} />
              <FieldError>{errors.fullName?.message}</FieldError>
            </TextField>

            <TextField>
              <Label>Email</Label>
              <Input {...register("email")} type="email" disabled />
              <Description>Contact support to change your email.</Description>
            </TextField>

            {message && (
              <p
                className={`text-sm ${message.type === "success" ? "text-success" : "text-danger"}`}
              >
                {message.text}
              </p>
            )}

            <Button type="submit" variant="primary" isDisabled={isLoading} className="self-start">
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </Card.Content>
      </Card>
    </div>
  );
}
