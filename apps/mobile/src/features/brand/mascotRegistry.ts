import welcome from '../../../assets/mascot/fatih-abi-welcome.png';
import happy from '../../../assets/mascot/fatih-abi-happy.png';
import proud from '../../../assets/mascot/fatih-abi-proud.png';
import celebrating from '../../../assets/mascot/fatih-abi-celebrating.png';
import thinking from '../../../assets/mascot/fatih-abi-thinking.png';
import explaining from '../../../assets/mascot/fatih-abi-explaining.png';
import encouraging from '../../../assets/mascot/fatih-abi-encouraging.png';
import concerned from '../../../assets/mascot/fatih-abi-concerned.png';
import neutral from '../../../assets/mascot/fatih-abi-neutral.png';
import success from '../../../assets/mascot/fatih-abi-success.png';

export const mascotAssets = {
  welcome,
  happy,
  proud,
  celebrating,
  thinking,
  explaining,
  encouraging,
  concerned,
  neutral,
  success,
} as const;

export type MascotState = keyof typeof mascotAssets;
