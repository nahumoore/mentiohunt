type EventProperties = Record<string, string | number | boolean | null | undefined>;

export function captureEvent(_name: string, _properties?: EventProperties) {
  void _name;
  void _properties;
}

export function identifyAnalyticsUser(
  _userId: string,
  _traits?: EventProperties,
) {
  void _userId;
  void _traits;
}
