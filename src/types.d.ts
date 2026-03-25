declare module "update-notifier" {
  interface Options {
    pkg: { name: string; version: string };
  }
  interface Notifier {
    notify(): void;
  }
  export default function updateNotifier(options: Options): Notifier;
}
