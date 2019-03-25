import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as pulumi from "@pulumi/pulumi";
import * as eks from "@pulumi/eks";

// Get configuration for the stack
const config = new pulumi.Config();
const instanceType = config.get("instanceType") as aws.ec2.InstanceType;
const desiredCapacity = config.getNumber("desiredCapacity");
const minSize = config.getNumber("minSize");
const maxSize = config.getNumber("maxSize");
const storageClass = config.get("storageClass") as eks.EBSVolumeType;
const deployDashboard = config.getBoolean("deployDashboard");

// Create a VPC for our cluster.
const vpc = new awsx.ec2.Vpc("eksNetwork", {
  numberOfAvailabilityZones: 2,
  subnets: [{ type: "public" }, { type: "private" }]
});

// Create an EKS cluster with the given configuration.
const cluster = new eks.Cluster("cluster", {
  vpcId: vpc.id,
  subnetIds: vpc.id.apply(id => getSubnetIds(id)),
  instanceType: instanceType,
  desiredCapacity: desiredCapacity,
  minSize: minSize,
  maxSize: maxSize,
  storageClasses: storageClass,
  deployDashboard: deployDashboard
});

async function getSubnetIds(vpcId: string): Promise<string[]> {
  const result = await aws.ec2.getSubnetIds({ vpcId });
  return result.ids;
}

// Export the cluster's kubeconfig.
export const kubeconfig = cluster.kubeconfig;
