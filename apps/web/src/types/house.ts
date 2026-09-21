export type HouseStatus = 'ACTIVE' | 'INACTIVE';

export interface SchoolHouse {
  id: string;
  name: string;
  shortName?: string;
  description?: string;
  status: HouseStatus;
  color?: string;
}
