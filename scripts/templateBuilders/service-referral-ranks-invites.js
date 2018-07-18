/*
 * Builds a k8s template file into k8s-generated
 * 
 * * Template variables provided
 * - imageUrl
 * - imagePullPolicy
 * - shardId
 * - deploymentStage
 * 
 * == Inside CI ==
 * Env variables required:
 * - GOOGLE_PROJECT_ID
 * - CIRCLE_BRANCH
 * - CIRCLE_BUILD_NUM
 * 
 * 
 * == For local kubernetes build ==
 * - 
 * 
 */
