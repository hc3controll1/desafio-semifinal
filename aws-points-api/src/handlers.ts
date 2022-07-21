import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import AWS, { Request } from "aws-sdk";
import { v4 } from "uuid";
import * as yup from "yup";

interface IPoints {
  userID: string;
  points: number;
  pointsID?: string;
}

const docClient = new AWS.DynamoDB.DocumentClient();
const tableName = "PointsTable";
const headers = {
  "content-type": "application/json",
  "Access-Control-Allow-Headers" : "Content-Type",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "OPTIONS,PUT,GET"
};

const schema = yup.object().shape({
  userID: yup.string().required(),
  points: yup.number().required(),  
});

class HttpError extends Error {
  constructor(public statusCode: number, body: Record<string, unknown> = {}) {
    super(JSON.stringify(body));
  }
}

const handleError = (e: unknown) => {
  if (e instanceof yup.ValidationError) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        errors: e.errors,
      }),
    };
  }

  if (e instanceof SyntaxError) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: `invalid request body format : "${e.message}"` }),
    };
  }

  if (e instanceof HttpError) {
    return {
      statusCode: e.statusCode,
      headers,
      body: e.message,
    };
  }

  throw e;
};

export const addPoints = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const reqBody: IPoints = JSON.parse(event.body as string);

    await schema.validate(reqBody, { abortEarly: true });

    const pointsUserRequest = {
      userID: reqBody.userID,
      points: +reqBody.points,   
      pointsID: v4()    
    };       

    const userAlreadyExists = await fetchUserById(pointsUserRequest.userID);

    if (!userAlreadyExists) {
      await docClient
      .put({
        TableName: tableName,
        Item: pointsUserRequest,
      })
      .promise();

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(pointsUserRequest),
      };
    }

    const points: number = userAlreadyExists.points + pointsUserRequest.points;
    const pointsUserAdd = {
      ...userAlreadyExists,
      points
    };

    await docClient
      .put({
        TableName: tableName,
        Item: pointsUserAdd,
      })
      .promise();

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(pointsUserAdd),
      };
 
  } catch (e) {
    return handleError(e);
  }
};

const fetchUserById = async (id: string) => {
  const output = await docClient
    .get({
      TableName: tableName,
      Key: {
        userID: id,
      },
    })
    .promise();

  if (!output.Item) {
    return false;
  }

  return output.Item;
};

export const getPointsUser = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const pointsUser = await fetchUserById(event.pathParameters?.id as string);

    if(!pointsUser) {
      throw new HttpError(404, { error: "not found" });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(pointsUser),
    };
  } catch (e) {
    return handleError(e);
  }
}; 

export const listPoints = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const output = await docClient
    .scan({
      TableName: tableName,
    })
    .promise();

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(output.Items),
  };
};




