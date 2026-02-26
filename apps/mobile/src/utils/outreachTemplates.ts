export const DEFAULT_MESSAGE_TEMPLATE =
  "Hello! Is this the parent of {kidName}? This is {servantName}, one of {kidName}'s servants at St. Mary's. I was looking to take {kidName} to a restaurant or some place he likes — would today at 7:30 work?"

export function fillTemplate(
  template: string,
  kidName: string,
  servantName: string,
): string {
  return template
    .replace(/\{kidName\}/g, kidName)
    .replace(/\{servantName\}/g, servantName)
}
