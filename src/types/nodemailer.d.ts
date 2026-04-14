declare module "nodemailer" {
  export type Transporter = {
    sendMail: (...args: any[]) => Promise<any> | any;
  };

  export function createTransport(options: any): Transporter;

  const nodemailer: {
    createTransport: typeof createTransport;
  };

  export default nodemailer;
}
