const net = require("net");

const truncateIP = (ip: string) => {
  const ipV = net.isIP(ip);
  if (ipV === 0) {
    throw new Error("no valid IP supplied");
  }
  if (ipV === 6) {
    return maskIpv6(ip);
  }
  return maskIpv4(ip);
};

const maskIpv6 = (ip: string) => {
  const ipArray = ip.split(":");
  const mask = ipArray.splice(4, 4, "0", "0", "0", "0");
  const maskedIp6 = ipArray.join(":");
  return maskedIp6;
};
const maskIpv4 = (ip: string) => {
  const ipArray = ip.split(".");
  const mask = ipArray.splice(2, 2, "0", "0");
  const maskedIp4 = ipArray.join(".");
  return maskedIp4;
};

export default truncateIP;
