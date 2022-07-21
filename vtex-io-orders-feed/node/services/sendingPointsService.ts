
import { json } from 'co-body'

export async function calculateCashbackService({
  req: request,
  clients: { orders, pointsClient},
}: Context) {
  const body = await json(request)

  if (!body.orderId) throw Error

  const {
    value,
    clientProfileData: { userProfileId },
  } = await orders.getOrder(body.orderId)

  return pointsClient.sendingPoints({
    userID: userProfileId,
    points: Math.floor(value / 100),
  })
}
