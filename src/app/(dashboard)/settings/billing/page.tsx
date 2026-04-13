"use client";

import { Button, Card, Chip } from "@heroui/react";

const PLANS = {
  free: {
    name: "Free",
    description: "Get started with the basics",
    price: 0,
    features: ["Up to 3 projects", "Basic analytics", "Community support", "1 GB storage"],
  },
  pro: {
    name: "Pro",
    description: "Everything you need to grow",
    price: 29,
    features: [
      "Unlimited projects",
      "Advanced analytics",
      "Priority support",
      "10 GB storage",
      "Custom domains",
      "Team collaboration",
    ],
  },
  enterprise: {
    name: "Enterprise",
    description: "For large-scale operations",
    price: 99,
    features: [
      "Unlimited everything",
      "Dedicated support",
      "99.9% SLA",
      "100 GB storage",
      "Custom integrations",
      "Advanced security",
      "Audit logs",
      "SSO / SAML",
    ],
  },
};

export default function BillingPage() {
  const currentPlan = PLANS.free;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Billing</h1>

      <Card>
        <Card.Header className="flex items-center justify-between">
          <Card.Title>Current Plan</Card.Title>
          <Chip color="success" size="sm">
            <Chip.Label>active</Chip.Label>
          </Chip>
        </Card.Header>
        <Card.Content className="flex flex-col gap-4">
          <div>
            <p className="text-2xl font-bold">{currentPlan.name}</p>
            <p className="text-default-500">{currentPlan.description}</p>
          </div>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title>Upgrade Your Plan</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="grid gap-4 sm:grid-cols-2">
            {Object.entries(PLANS)
              .filter(([key]) => key !== "free")
              .map(([key, plan]) => (
                <Card key={key} variant="secondary">
                  <Card.Content className="flex flex-col gap-2">
                    <h3 className="font-semibold">{plan.name}</h3>
                    <p className="text-2xl font-bold">
                      ${plan.price}
                      <span className="text-sm text-default-500">/mo</span>
                    </p>
                    <p className="text-sm text-default-500">{plan.description}</p>
                    <Button variant={key === "pro" ? "primary" : "outline"} className="mt-2">
                      Upgrade to {plan.name}
                    </Button>
                  </Card.Content>
                </Card>
              ))}
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
