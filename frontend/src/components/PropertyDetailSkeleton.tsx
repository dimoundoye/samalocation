import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

const PropertyDetailSkeleton = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar area placeholder */}
      <div className="h-16 border-b bg-white/80 backdrop-blur-md sticky top-0 z-50"></div>

      <div className="pt-24 pb-16 px-4 md:px-8">
        <div className="container mx-auto max-w-6xl">
          {/* Back button skeleton */}
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-10 w-48 rounded-md" />
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {/* Left Column */}
            <div className="md:col-span-2 space-y-6">
              {/* Image Carousel Skeleton */}
              <div className="space-y-4">
                <Skeleton className="w-full aspect-video md:aspect-[16/10] rounded-xl" />
                <div className="hidden md:flex gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="w-32 h-20 rounded-lg" />
                  ))}
                </div>
              </div>

              {/* Info Card Skeleton */}
              <Card className="shadow-soft border-none">
                <CardContent className="p-6 space-y-8">
                  {/* Title and Address */}
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-3/4 rounded-md" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <Skeleton className="h-5 w-1/2 rounded-md" />
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-end gap-2">
                    <Skeleton className="h-12 w-48 rounded-md" />
                    <Skeleton className="h-6 w-16 rounded-md mb-1" />
                  </div>

                  {/* Features Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="space-y-2">
                          <Skeleton className="h-3 w-12 rounded-md" />
                          <Skeleton className="h-4 w-20 rounded-md" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Description */}
                  <div className="space-y-4 pt-4">
                    <Skeleton className="h-7 w-40 rounded-md" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full rounded-md" />
                      <Skeleton className="h-4 w-full rounded-md" />
                      <Skeleton className="h-4 w-4/5 rounded-md" />
                    </div>
                  </div>

                  {/* Equipments */}
                  <div className="space-y-4 pt-4">
                    <Skeleton className="h-7 w-40 rounded-md" />
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-8 w-24 rounded-full" />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="md:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Application Card */}
                <Card className="shadow-soft border-none overflow-hidden">
                  <div className="p-6 space-y-6">
                    <Skeleton className="h-7 w-48 rounded-md" />
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-full rounded-md" />
                      <Skeleton className="h-3 w-full rounded-md" />
                      <Skeleton className="h-3 w-4/5 rounded-md" />
                    </div>
                    <Skeleton className="h-12 w-full rounded-md" />
                  </div>
                </Card>

                {/* Owner Card */}
                <Card className="shadow-soft border-none">
                  <div className="p-6 space-y-6">
                    <Skeleton className="h-6 w-32 rounded-md" />
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-40 rounded-md" />
                        <Skeleton className="h-3 w-24 rounded-md" />
                      </div>
                    </div>
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <Skeleton className="h-4 w-32 rounded-md" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <Skeleton className="h-4 w-48 rounded-md" />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Share buttons */}
                <Card className="shadow-soft border-none">
                  <div className="p-6 space-y-4">
                    <Skeleton className="h-6 w-40 rounded-md" />
                    <div className="grid grid-cols-3 gap-2">
                      <Skeleton className="h-14 rounded-lg" />
                      <Skeleton className="h-14 rounded-lg" />
                      <Skeleton className="h-14 rounded-lg" />
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>

          {/* Similar Properties Section */}
          <section className="mt-16 space-y-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-48 rounded-md" />
              <Skeleton className="h-8 w-32 rounded-md" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="shadow-soft overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-4 space-y-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex justify-between items-center pt-2">
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-10 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailSkeleton;
