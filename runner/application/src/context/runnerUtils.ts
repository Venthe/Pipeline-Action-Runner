import { Arch, OS } from "@pipeline/types";

export const mapOS = (platform: NodeJS.Platform): OS =>  {
    switch (platform) {
      case 'linux':
        return "Linux"
      default:
        throw new Error(`Unsupported platform ${platform}`);
  }
}

export const mapArchitecture = (architecture: NodeJS.Architecture): Arch =>  {
    switch (architecture) {
      case "x64":
        return "X64"
      default:
        throw new Error(`Unsupported architecture ${architecture}`);
  }
}