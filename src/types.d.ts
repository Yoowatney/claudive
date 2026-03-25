declare module "update-notifier" {
  interface UpdateInfo {
    latest: string;
    current: string;
    type: string;
    name: string;
  }
  interface Options {
    pkg: { name: string; version: string };
    updateCheckInterval?: number;
  }
  interface Notifier {
    update?: UpdateInfo;
    notify(): void;
    fetchInfo(): Promise<UpdateInfo>;
  }
  export default function updateNotifier(options: Options): Notifier;
}
