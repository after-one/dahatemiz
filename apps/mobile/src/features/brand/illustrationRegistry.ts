import communitySapling from '../../../assets/illustrations/community-sapling.png';
import emptyFeedNeighborhood from '../../../assets/illustrations/empty-feed-neighborhood.png';

export const illustrationAssets = {
  'empty-feed': emptyFeedNeighborhood,
  'community-sapling': communitySapling,
} as const;

export type IllustrationKey = keyof typeof illustrationAssets;
