import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const AboutPage = () => {
  return (
    <div className="bg-gradient-to-br from-background to-muted/20">
      <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col justify-center">
        {/* Vision Section */}
        <section className="mb-12">
          <h1 className="text-5xl font-bold tracking-tight mb-6">
            Our Vision
          </h1>
          <Card className="border-none shadow-lg bg-background/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <p className="text-xl text-muted-foreground leading-relaxed">
                MakeX is revolutionizing the way applications are built. We're creating a platform that empowers developers and businesses to build powerful applications with unprecedented ease. Our vision extends beyond just building apps - we're creating an ecosystem that will include our own AI-powered app store, making advanced technology accessible to everyone.
              </p>
            </CardContent>
          </Card>
        </section>


        <Separator className="my-8" />

        {/* Backers Section */}
        <section>
          <h2 className="text-4xl font-bold tracking-tight mb-6">
            Backed By Industry Leaders
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-none shadow-lg bg-background/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-center">LAUNCH</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">
                  Strategic partner in our journey
                </p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-lg bg-background/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-center">On Deck</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">
                  Supporting our growth and innovation
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutPage; 