#!/usr/bin/env node
import "source-map-support/register";
import { App } from "aws-cdk-lib";
import { RootStack } from "../lib/RootStack";

new RootStack(new App(), "ab3-app");
