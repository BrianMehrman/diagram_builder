/**
 * Sign Renderer
 *
 * Maps a SignType to the correct sign component. Used by CityView
 * to render the appropriate sign for each node.
 */

import { NeonSign } from './NeonSign';
import { BrassPlaque } from './BrassPlaque';
import { HangingSign } from './HangingSign';
import { HighwaySign } from './HighwaySign';
import { LabelTape } from './LabelTape';
import { MarqueeSign } from './MarqueeSign';
import { ConstructionSign } from './ConstructionSign';
import type { SignType } from './signUtils';
import type { Position3D } from '../../../../shared/types';

interface RenderSignOptions {
  key: string;
  signType: SignType;
  text: string;
  position: Position3D;
  visible: boolean;
}

/**
 * Render the correct sign component for a given sign type.
 */
export function renderSign({ key, signType, text, position, visible }: RenderSignOptions) {
  const props = { key, text, position, visible };

  switch (signType) {
    case 'neon':
      return <NeonSign {...props} />;
    case 'brass':
      return <BrassPlaque {...props} />;
    case 'hanging':
      return <HangingSign {...props} />;
    case 'highway':
      return <HighwaySign {...props} />;
    case 'labelTape':
      return <LabelTape {...props} />;
    case 'marquee':
      return <MarqueeSign {...props} />;
    case 'construction':
      return <ConstructionSign {...props} />;
  }
}
