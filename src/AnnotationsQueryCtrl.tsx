export class AnnotationsQueryCtrl {
  annotation: any;
  datasource: any;
  namespaces: any;

  kinds = [
    { value: 'PodChaos', text: 'Pod Chaos' },
    { value: 'NetworkChaos', text: 'Network Chaos' },
    { value: 'IOChaos', text: 'IO Chaos' },
    { value: 'TimeChaos', text: 'Time Chaos' },
    { value: 'KernelChaos', text: 'Kernel Chaos' },
    { value: 'StressChaos', text: 'Stress Chaos' },
  ];

  static templateUrl = 'partials/annotations.editor.html';

  constructor() {
    this.annotation.kind = this.annotation.kind || 'PodChaos';
    this.namespaces = [];
    this.initDropDown();
  }

  async initDropDown() {
    this.datasource.queryNamespaces().then((result: any) => {
      this.namespaces = result.data.map((ns: string) => ({ text: ns, value: ns }));
    });
  }
}
