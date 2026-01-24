import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, ShoppingCart, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { tiers } from "./data/tiers";

export default function ProductPage() {
  const [cartItems, setCartItems] = useState([]);
  const cartCount = cartItems.reduce((sum, item) => sum + item.qty, 0);

  const onAddToCart = (tier) => {
    setCartItems((items) => {
      const existing = items.find((item) => item.name === tier.name);
      if (existing) {
        return items.map((item) =>
          item.name === tier.name ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...items, { name: tier.name, price: tier.price, qty: 1 }];
    });
  };

  const onRemoveFromCart = (name) => {
    setCartItems((items) =>
      items
        .map((item) => (item.name === name ? { ...item, qty: item.qty - 1 } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const onClearCart = () => {
    setCartItems([]);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-2xl border bg-muted/30 shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">KAtl Solutions</div>
              <div className="text-xs text-muted-foreground">Packages & cart</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="rounded-xl px-3 py-1">
              <span className="inline-flex items-center gap-2 text-xs font-medium">
                <ShoppingCart className="h-3.5 w-3.5" />
                {cartCount} items
              </span>
            </Badge>
            <Button variant="outline" className="rounded-xl" asChild>
              <Link to="/">Back to home</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-2">
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Choose a package
          </h1>
          <p className="max-w-2xl text-pretty text-sm text-muted-foreground sm:text-base">
            Add packages to your cart and share it with the team when you are ready to talk.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            {tiers.map((tier) => (
              <Card key={tier.name} className="rounded-3xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{tier.name}</CardTitle>
                    {tier.featured ? (
                      <Badge className="rounded-xl">Popular</Badge>
                    ) : (
                      <Badge variant="secondary" className="rounded-xl">
                        Flexible
                      </Badge>
                    )}
                  </div>
                  <div className="mt-2 flex items-end gap-2">
                    <div className="text-3xl font-semibold tracking-tight sm:text-4xl">
                      {tier.price}
                    </div>
                    <div className="pb-1 text-sm text-muted-foreground">{tier.period}</div>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{tier.highlight}</div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    <Button className="w-full rounded-2xl" onClick={() => onAddToCart(tier)}>
                      Add to cart
                    </Button>
                    <div className="grid gap-2">
                      {tier.bullets.map((bullet) => (
                        <div key={bullet} className="flex items-start gap-2 text-sm">
                          <div className="mt-0.5 grid h-5 w-5 place-items-center rounded-full border bg-muted/20">
                            <Check className="h-3.5 w-3.5" />
                          </div>
                          <div className="text-muted-foreground">{bullet}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="h-fit rounded-3xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Your cart</CardTitle>
                <Button
                  variant="ghost"
                  className="rounded-xl"
                  onClick={onClearCart}
                  disabled={cartItems.length === 0}
                >
                  Clear
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3">
              {cartItems.length === 0 ? (
                <div className="rounded-2xl border bg-muted/10 p-4 text-sm text-muted-foreground">
                  Cart is empty.
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={item.name} className="rounded-2xl border bg-muted/10 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground">{item.price}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">Qty: {item.qty}</div>
                    </div>
                    <Separator className="my-3" />
                    <Button
                      variant="ghost"
                      className="rounded-xl"
                      onClick={() => onRemoveFromCart(item.name)}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Remove one
                    </Button>
                  </div>
                ))
              )}
              <div className="rounded-2xl border bg-background p-4 text-xs text-muted-foreground">
                Share your cart during your kickoff call to speed up scoping.
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
