import React from 'react';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Card, CardContent } from '@/components/ui/card';

interface IStatisticsItem {
  image: string;
  number: string;
  label: string;
}
type IStatisticsItems = Array<IStatisticsItem>;

interface IStatisticsProps {
  details: IStatisticsItem[];
}

const Statistics = ({ details }: IStatisticsProps) => {
  return (
    <Card className="h-full border-0 md:border">
      <CardContent className="px-0 py-4 md:p-5 lg:px-10 h-full flex flex-col justify-center">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-8 md:gap-y-0 w-full items-center bg-transparent">
          {details.map((item, index) => {
            const isLast = index === details.length - 1;

            // On mobile, first item has right border, second doesn't. On desktop, both have right border.
            const borderClasses = index === 0
              ? 'border-r border-border/60'
              : index === 1
                ? 'md:border-r md:border-border/60'
                : '';

            return (
              <div
                key={index}
                className={`
                  flex px-4 md:px-6
                  ${isLast ? 'col-span-2 md:col-span-1 bg-secondary/30 md:bg-transparent border border-border/60 md:border-0 rounded-2xl md:rounded-none py-4 md:py-0 flex-row gap-5 items-center justify-center mx-4 md:mx-0 shadow-sm md:shadow-none' : 'flex-col md:flex-row items-center gap-4 md:gap-3 text-center md:text-left py-2 md:py-0'} 
                  ${borderClasses}
                `}
              >
                <img
                  src={toAbsoluteUrl(`/media/brand-logos/${item.image}`)}
                  className={`${isLast ? 'h-14 md:h-10' : 'h-20 md:h-10'} drop-shadow-lg`}
                  alt="image"
                />
                <div className={`flex flex-col ${isLast ? 'text-left' : 'text-center md:text-left'}`}>
                  <span className="text-mono text-4xl md:text-2xl font-bold md:font-semibold">
                    {item.number}
                  </span>
                  <span className="text-secondary-foreground text-sm mt-1 md:mt-0">
                    {item.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export {
  Statistics,
  type IStatisticsItem,
  type IStatisticsItems,
  type IStatisticsProps,
};
