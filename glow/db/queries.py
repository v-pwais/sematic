"""
Module holding common DB queries.
"""
# Standard library
from typing import List, Optional, Dict

# Third-party
import sqlalchemy.orm

# Glow
from glow.db.models.artifact import Artifact
from glow.db.models.edge import Edge
from glow.db.models.run import Run
from glow.db.db import db


def count_runs() -> int:
    """
    Counts all runs.

    Returns
    -------
    int
        Run count
    """
    with db().get_session() as session:
        run_count = session.query(Run).count()

    return run_count


def get_run(run_id: str) -> Run:
    """
    Get a run from the database.

    Parameters
    ----------
    run_id : str
        ID of run to retrieve.

    Returns
    -------
    Run
        Fetched run
    """
    with db().get_session() as session:
        return session.query(Run).filter(Run.id == run_id).one()


def save_run(run: Run) -> Run:
    """
    Save run to the database.

    Parameters
    ----------
    run : Run
        Run to save

    Returns
    -------
    Run
        saved run
    """
    with db().get_session() as session:
        session.add(run)
        session.commit()
        session.refresh(run)

    return run


def create_run_with_artifacts(run: Run, artifacts: Dict[str, Artifact]) -> Run:
    edges = [
        Edge(destination_run_id=run.id, destination_name=name, artifact_id=artifact.id)
        for name, artifact in artifacts.items()
    ]
    save_graph([run], list(artifacts.values()), edges)
    return run


def set_run_output_artifact(run, artifact):
    edge = Edge(source_run_id=run.id, artifact_id=artifact.id)
    save_graph([run], [artifact], [edge])


def save_graph(runs: List[Run], artifacts: List[Artifact], edges: List[Edge]):
    unique_artifacts = []
    with db().get_session() as session:
        session.add_all(runs)
        unique_artifacts = [
            _add_unique_artifact(session, artifact) for artifact in artifacts
        ]

        # session.flush()
        session.add_all(edges)
        session.commit()

        for run in runs:
            session.refresh(run)

        for artifact in unique_artifacts:
            session.refresh(artifact)

        for edge in edges:
            session.refresh(edge)


def get_run_output_artifact(run_id: str) -> Optional[Artifact]:
    """Get a run's output artifact."""
    with db().get_session() as session:
        return (
            session.query(Artifact)
            .join(Edge, Edge.artifact_id == Artifact.id)
            .filter(Edge.source_run_id == run_id)
            .first()
        )


def get_run_input_artifacts(run_id: str) -> Dict[str, Artifact]:
    """Get a mapping of a run's input artifacts."""
    with db().get_session() as session:
        edges = set(
            session.query(Edge)
            .with_entities(Edge.artifact_id, Edge.destination_name)
            .filter(Edge.destination_run_id == run_id)
            .all()
        )
        artifact_ids = set(edge.artifact_id for edge in edges)
        artifacts = session.query(Artifact).filter(Artifact.id.in_(artifact_ids)).all()
        artifacts_by_id = {artifact.id: artifact for artifact in artifacts}

        return {
            edge.destination_name: artifacts_by_id[edge.artifact_id] for edge in edges
        }


def _add_unique_artifact(
    session: sqlalchemy.orm.Session, artifact: Artifact
) -> Artifact:
    existing_artifact = (
        session.query(Artifact).filter(Artifact.id == artifact.id).first()
    )

    if existing_artifact is None:
        session.add(artifact)
    else:
        artifact = existing_artifact

    return artifact
