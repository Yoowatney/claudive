import { Component } from "react";
import { Box, Text } from "ink";

const ISSUES_URL = "https://github.com/Yoowatney/claude-dash/issues/new";

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      const title = encodeURIComponent(
        `Bug: ${this.state.error.message.slice(0, 80)}`,
      );

      return (
        <Box flexDirection="column" padding={1}>
          <Text bold color="red">
            claude-dash crashed
          </Text>
          <Box marginTop={1}>
            <Text>{this.state.error.message}</Text>
          </Box>
          <Box marginTop={1}>
            <Text color="yellow">Please report this issue:</Text>
          </Box>
          <Box>
            <Text color="cyan">{ISSUES_URL}?title={title}</Text>
          </Box>
          <Box marginTop={1}>
            <Text dimColor>
              {this.state.error.stack
                ?.split("\n")
                .slice(1, 5)
                .join("\n") ?? ""}
            </Text>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}
