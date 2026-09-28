import React, { memo } from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import Colors from '@/constants/Colors';

/** Tampon encreur dessiné dans la charte (contours anthracite, manche orange). */
function TamponSvg({ taille = 64 }: { taille?: number }) {
  return (
    <Svg width={taille} height={taille * 1.15} viewBox="0 0 64 74">
      {/* Pommeau */}
      <Circle cx={32} cy={11} r={9} fill={Colors.encre} stroke={Colors.anthracite} strokeWidth={3} />
      {/* Manche */}
      <Path d="M26 18 L38 18 L40 40 L24 40 Z" fill={Colors.encreClaire} stroke={Colors.anthracite} strokeWidth={3} strokeLinejoin="round" />
      {/* Monture */}
      <Rect x={10} y={40} width={44} height={16} rx={5} fill={Colors.encreOmbre} stroke={Colors.anthracite} strokeWidth={3} />
      {/* Caoutchouc encré */}
      <Rect x={13} y={56} width={38} height={10} rx={3} fill={Colors.rouge} stroke={Colors.anthracite} strokeWidth={3} />
      {/* Reflet */}
      <Path d="M16 45 L30 45" stroke={Colors.texteSurEncre} strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}

export default memo(TamponSvg);
