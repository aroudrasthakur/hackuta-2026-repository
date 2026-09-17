import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";

export function renderWithRouter(ui: ReactElement, route = "/") {
  return render(ui, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
    ),
  });
}

export function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  return render(ui, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <MemoryRouter>{children}</MemoryRouter>
    ),
    ...options,
  });
}
