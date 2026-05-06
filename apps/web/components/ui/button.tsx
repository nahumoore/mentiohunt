import * as React from "react";
import { Button as BaseButton } from "@workspace/ui/components/button";

type BaseVariant = React.ComponentProps<typeof BaseButton>["variant"];

type ButtonProps = Omit<React.ComponentProps<typeof BaseButton>, "variant"> & {
  variant?: BaseVariant | "animated";
};

export function Button({ variant, ...props }: ButtonProps) {
  const resolvedVariant: BaseVariant = variant === "animated" ? "default" : variant;

  return <BaseButton variant={resolvedVariant} {...props} />;
}
