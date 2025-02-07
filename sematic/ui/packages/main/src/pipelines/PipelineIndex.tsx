import { InfoOutlined } from "@mui/icons-material";
import {
    Alert,
    AlertTitle,
    Container,
    containerClasses,
    Skeleton,
} from "@mui/material";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/system";
import MuiRouterLink from "@sematic/common/src/component/MuiRouterLink";
import TimeAgo from "@sematic/common/src/component/TimeAgo";
import useBasicMetrics from "@sematic/common/src/hooks/metricsHooks";
import { useFetchRuns } from "@sematic/common/src/hooks/runHooks";
import { Run } from "@sematic/common/src/Models";
import { pipelineSocket } from "@sematic/common/src/sockets";
import { useCallback, useMemo } from "react";
import CalculatorPath from "src/components/CalculatorPath";
import { RunList, RunListColumn } from "src/components/RunList";
import RunStateChip, {
    RunStateChipUndefinedStyle,
} from "src/components/RunStateChip";
import { RunTime } from "src/components/RunTime";
import Tags from "src/components/Tags";

const RecentStatusesWithStyles = styled("span")`
  flex-direction: row;
  display: flex;
`;

const StyledRootBox = styled(Box, {
    shouldForwardProp: () => true,
})`
  height: 100%;

  & .main-content {
    overflow-y: hidden;

    & .${containerClasses.root} {
      height: 100%;

      & > * {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
    }
  }
`;

function PipelineMetric(props: { value: string; label: string }) {
    const { value, label } = props;
    return (
        <Box sx={{ textAlign: "center" }}>
            <Typography sx={{ fontSize: 18 }}>{value}</Typography>
            <Typography
                fontSize="small"
                color="Gray
    "
            >
                {label}
            </Typography>
        </Box>
    );
}

function PipelineMetrics(props: { run: Run }) {
    const { run } = props;
    const {payload, loading, error, successRate, avgRuntime} = useBasicMetrics({ runId: run.id, 
        rootFunctionPath: run.function_path });

    return (
        <>
            {loading === true && <Skeleton />}
            {loading !== true && error === undefined && payload && (
                <Box sx={{ display: "flex", flexDirection: "row", columnGap: 5 }}>
                    <PipelineMetric
                        value={payload.content.total_count.toString()}
                        label="runs"
                    />
                    <PipelineMetric value={successRate} label="success" />
                    <PipelineMetric value={avgRuntime} label="avg. time" />
                </Box>
            )}
        </>
    );
}

const TableColumns: Array<RunListColumn> = [
    {
        name: "Name",
        width: "45%",
        render: (run: Run) => <PipelineNameColumn run={run} />,
    },
    {
        name: "Last run",
        width: "20%",
        render: (run: Run) => (
            <>
                <TimeAgo date={run.created_at} />
                <RunTime run={run} prefix="in" />
            </>
        ),
    },
    {
        name: "Metrics",
        width: "20%",
        render: (run: Run) => <PipelineMetrics run={run} />,
    },
    {
        name: "Last 5 runs",
        width: "15%",
        render: ({ function_path }: Run) => (
            <RecentStatuses functionPath={function_path} />
        ),
    },
];

function RecentStatuses(props: { functionPath: string }) {
    const { functionPath } = props;

    const runFilters = useMemo(
        () => ({
            function_path: { eq: functionPath },
        }),
        [functionPath]
    );

    const otherQueryParams = useMemo(
        () => ({
            limit: "5",
        }),
        []
    );

    const { isLoading, runs } = useFetchRuns(runFilters, otherQueryParams);

    function statusChip(index: number) {
        if (runs && runs.length > index) {
            return <RunStateChip run={runs[index]} key={index} />;
        } else {
            return <RunStateChipUndefinedStyle key={index} />;
        }
    }
    if (isLoading) {
        return <Skeleton />;
    }
    return (
        <RecentStatusesWithStyles>
            {[...Array(5)].map((e, i) => statusChip(i))}
        </RecentStatusesWithStyles>
    );
}

function PipelineNameColumn(props: { run: Run }) {
    let { run } = props;
    let { function_path, name, tags } = run;

    return (
        <>
            <Box sx={{ mb: 3 }}>
                <MuiRouterLink href={"/pipelines/" + function_path} underline="hover">
                    <Typography variant="h6">{name}</Typography>
                </MuiRouterLink>
                <CalculatorPath functionPath={function_path} />
            </Box>
            <Tags tags={tags || []} />
        </>
    );
}

function PipelineIndex() {
    const triggerRefresh = useCallback((refreshCallback: () => void) => {
        pipelineSocket.removeAllListeners();
        pipelineSocket.on("update", (args) => {
            refreshCallback();
        });
    }, []);

    return (
        <StyledRootBox sx={{ display: "grid", gridTemplateColumns: "1fr 300px" }}>
            <Box sx={{ gridColumn: 1 }} className={"main-content"}>
                <Container sx={{ pt: 15 }}>
                    <Box sx={{ mx: 5 }}>
                        <Box sx={{ mb: 10 }}>
                            <Typography variant="h2" component="h2">
                Your pipelines
                            </Typography>
                        </Box>
                        <RunList
                            columns={TableColumns}
                            groupBy="function_path"
                            filters={{ AND: [{ parent_id: { eq: null } }] }}
                            emptyAlert="No pipelines."
                            triggerRefresh={triggerRefresh}
                        />
                    </Box>
                </Container>
            </Box>
            <Box sx={{ gridColumn: 2, pr: 5, pt: 45 }}>
                <Alert severity="warning" icon={<InfoOutlined />}>
                    <AlertTitle>Your latest pipelines are listed here</AlertTitle>
                    <p>
            Pipelines are identified by the import path of their entry point,
            which is the function you called <code>.resolve()</code> on.
                    </p>
                </Alert>
            </Box>
        </StyledRootBox>
    );
}

export default PipelineIndex;
