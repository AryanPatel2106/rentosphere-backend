# ─── Amazon SNS Notifications for Pipelines & Alerts ────────────────────────

# SNS Topic for Pipeline Alerts
resource "aws_sns_topic" "pipeline_notifications" {
  name = "${var.project_name}-pipeline-notifications"

  tags = {
    Name = "${var.project_name}-pipeline-notifications"
  }
}

# Optional Email Subscription to SNS Topic
resource "aws_sns_topic_subscription" "email_subscription" {
  count     = var.notification_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.pipeline_notifications.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# SNS Topic Policy: Allow EventBridge to publish events
resource "aws_sns_topic_policy" "pipeline_notifications" {
  arn = aws_sns_topic.pipeline_notifications.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowEventBridgePublish"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "sns:Publish"
        Resource = aws_sns_topic.pipeline_notifications.arn
      }
    ]
  })
}

# EventBridge Rule: Trigger SNS on CodePipeline State Changes (FAILED or SUCCEEDED)
resource "aws_cloudwatch_event_rule" "pipeline_state_change" {
  name        = "${var.project_name}-pipeline-state-rule"
  description = "Trigger SNS notification on Rentosphere CodePipeline failure or success"

  event_pattern = jsonencode({
    source      = ["aws.codepipeline"]
    detail-type = ["CodePipeline Pipeline Execution State Change"]
    detail = {
      pipeline = [
        aws_codepipeline.backend.name,
        aws_codepipeline.frontend.name
      ]
      state = [
        "FAILED",
        "SUCCEEDED"
      ]
    }
  })

  tags = {
    Name = "${var.project_name}-pipeline-state-rule"
  }
}

# EventBridge Target: Send to SNS Topic
resource "aws_cloudwatch_event_target" "sns_target" {
  rule      = aws_cloudwatch_event_rule.pipeline_state_change.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.pipeline_notifications.arn
}
