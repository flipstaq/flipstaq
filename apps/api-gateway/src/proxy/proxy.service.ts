import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import {
  getServiceUrl,
  SERVICE_ENDPOINTS,
} from "../common/config/api-version.config";
import { firstValueFrom } from "rxjs";
import { AxiosResponse } from "axios";

@Injectable()
export class ProxyService {
  constructor(private readonly httpService: HttpService) {}

  async forwardRequest(
    service: keyof typeof SERVICE_ENDPOINTS,
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
    data?: any,
    headers?: Record<string, string>,
    params?: Record<string, any>
  ): Promise<AxiosResponse> {
    try {
      const serviceUrl = getServiceUrl(service);
      const url = `${serviceUrl}/internal/${endpoint}`;

      console.log(
        `🔄 Forwarding ${method} request to: ${url} (with internal headers)`
      );
      const config = {
        method,
        url,
        headers: {
          "Content-Type": "application/json",
          "x-api-gateway": "flipstaq-gateway",
          "x-internal-service": "true",
          "x-forwarded-from": "api-gateway",
          ...headers,
        },
        ...(data && { data }),
        ...(params && { params }),
      };

      const response = await firstValueFrom(this.httpService.request(config));
      return response;
    } catch (error) {
      console.error(
        `❌ Error forwarding to ${service} service:`,
        error.message
      );

      if (error.response) {
        // Forward the error response from the microservice
        throw new BadRequestException(error.response.data);
      }

      throw new InternalServerErrorException(
        `Failed to communicate with ${service} service`
      );
    }
  }
  async forwardAuthRequest(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
    data?: any,
    headers?: Record<string, string>
  ): Promise<AxiosResponse> {
    try {
      const serviceUrl = getServiceUrl("AUTH");
      const url = `${serviceUrl}/internal/auth/${endpoint}`;
      console.log(`🔄 Forwarding ${method} auth request to: ${url}`);
      console.log(
        `🔑 Headers being forwarded:`,
        JSON.stringify(headers, null, 2)
      );
      const config = {
        method,
        url,
        headers: {
          "Content-Type": "application/json",
          "x-api-gateway": "flipstaq-gateway",
          "x-forwarded-from": "api-gateway",
          ...headers,
        },
        ...(data && { data }),
      };

      const response = await firstValueFrom(this.httpService.request(config));
      return response;
    } catch (error) {
      console.error(
        `❌ Error forwarding auth request to auth-service:`,
        error.response?.data || error.message
      );

      if (error.response) {
        // Forward the error response from the auth service
        throw new BadRequestException(error.response.data);
      }

      throw new InternalServerErrorException(
        `Failed to communicate with auth service`
      );
    }
  }
  async forwardUserRequest(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
    data?: any,
    headers?: Record<string, string>,
    params?: Record<string, any>
  ): Promise<AxiosResponse> {
    return this.forwardRequest(
      "USER",
      `users${endpoint ? `/${endpoint}` : ""}`,
      method,
      data,
      headers,
      params
    );
  }
  async forwardProductRequest(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
    data?: any,
    headers?: Record<string, string>,
    params?: Record<string, any>
  ): Promise<AxiosResponse> {
    return this.forwardRequest(
      "PRODUCT",
      `products${endpoint ? `/${endpoint}` : ""}`,
      method,
      data,
      headers,
      params
    );
  }

  async forwardOrderRequest(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
    data?: any,
    headers?: Record<string, string>
  ): Promise<AxiosResponse> {
    return this.forwardRequest(
      "ORDER",
      `order/${endpoint}`,
      method,
      data,
      headers
    );
  }

  async forwardPaymentRequest(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
    data?: any,
    headers?: Record<string, string>
  ): Promise<AxiosResponse> {
    return this.forwardRequest(
      "PAYMENT",
      `payment/${endpoint}`,
      method,
      data,
      headers
    );
  }

  async forwardReviewRequest(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
    data?: any,
    headers?: Record<string, string>
  ): Promise<AxiosResponse> {
    return this.forwardRequest(
      "REVIEW",
      `review/${endpoint}`,
      method,
      data,
      headers
    );
  }

  async forwardNotificationRequest(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
    data?: any,
    headers?: Record<string, string>
  ): Promise<AxiosResponse> {
    return this.forwardRequest(
      "NOTIFICATION",
      `notification/${endpoint}`,
      method,
      data,
      headers
    );
  }
}
