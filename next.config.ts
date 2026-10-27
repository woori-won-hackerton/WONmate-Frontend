import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker 이미지용: 실행에 필요한 파일만 .next/standalone 에 모아줌
  output: "standalone",
};

export default nextConfig;