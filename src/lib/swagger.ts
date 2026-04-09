import { createSwaggerSpec } from "next-swagger-doc";

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: "src/pages/api",
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Mercedes-Benz Order Management API",
        version: "1.0.0",
        description: "API for managing Mercedes-Benz vehicle orders, products, and sales reports.",
      },
      tags: [
        { name: "Orders", description: "Order management endpoints" },
        { name: "Products", description: "Product management endpoints" },
        { name: "Reports", description: "Sales reporting endpoints" },
      ],
    },
  });
  return spec;
};
