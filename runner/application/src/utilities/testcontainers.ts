import { Container } from '@pipeline/types';
import { GenericContainer } from 'testcontainers';
import { PortWithOptionalBinding } from 'testcontainers/dist/src/port';
import { BindMode, BindMount } from 'testcontainers/dist/src/docker/types';
import { debug, error } from '@pipeline/core';

export const toContainer = (containerDefinition: Container, name: string): GenericContainer => {
  const container = new GenericContainer(containerDefinition.image);

  if (containerDefinition.env) {
    debug(`Adding env variables to ${name}\n${JSON.stringify(containerDefinition.env)}`);
    container.withEnvironment(containerDefinition.env);
  }

  if (containerDefinition.ports) {
    const ports: PortWithOptionalBinding[] = containerDefinition.ports?.map((port) =>
      mapPortToPortWithOptionalBinding(port)
    );
    debug(`Adding ports to ${name}\n${JSON.stringify(ports)}`);
    container.withExposedPorts(...ports);
  }

  if (containerDefinition.volumes) {
    const volumes = containerDefinition.volumes?.map((volume) => mapVolume(volume));
    debug(`Adding volumes to ${name}\n${JSON.stringify(volumes)}`);
    container.withBindMounts(volumes);
  }

  if (containerDefinition.credentials) {
    error('Unsupported option: Container credential');
  }

  if (containerDefinition.command) {
    debug(`Setting cmd to ${name}\n${containerDefinition.command}`);
    container.withCommand(containerDefinition.command);
  }

  if (containerDefinition.entrypoint) {
    debug(`Setting entrypoint to ${name}\n${containerDefinition.entrypoint}`);
    container.withEntrypoint(containerDefinition.entrypoint);
  }

  return container;
};

export const mapPortToPortWithOptionalBinding = (
  port: string | number
): PortWithOptionalBinding => {
  const {
    port: _port,
    host,
    container
  } = (typeof port === 'string' ? port : `${port}`).match(
    /^(?<port>\d+)$|^(?<host>\d+):(?<container>\d+)$/
  )?.groups ?? {};
  if (_port) {
    return +_port;
  } else {
    return {
      container: +container,
      host: +host
    };
  }
};

export const mapVolume = (mapping: string): BindMount => {
  const { source, target, mode } =
    mapping.match(/^(?<source>[^:]+):(?<target>[^:]+)(:(?<mode>rw|ro|z|Z))?$/)?.groups ?? {};
  return {
    source,
    target,
    ...(mode ? { mode: mode as BindMode } : {})
  };
};
